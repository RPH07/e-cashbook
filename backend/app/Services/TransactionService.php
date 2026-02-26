<?php

namespace App\Services;

use App\Services\AuditLogService;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionService {

    public static function createTransaction($data) {
        return DB::transaction(function () use ($data){
            try {
                $prefix = $data['type'] === 'transfer' ? 'TRF' : 'TRX';
                $timestamp = now()->getTimestampMs();
                $random = rand(1000, 2000);
                $generatedRefId = "{$prefix}-{$timestamp}-{$random}";

                $transactionStatus = $data['status'] ?? 'pending';

                // Menyimpan transaksi dan referensi id
                $newTransaction = Transaction::create(array_merge($data, [
                    'reference_id' => $data['referenceId'] ?? $generatedRefId,
                    'status' => $transactionStatus,
                    'balance_before' => 0,
                    'balance_after' => 0
                ]));

                AuditLogService::record($data['userId'], 'CREATE_TRANSACTION', "Membuat transaksi {$generatedRefId} sebesar {$data['amount']}");

                $fullTransaction = Transaction::with(['account', 'category', 'user'])->find($newTransaction->id);

                return $fullTransaction;

            } catch (\Exception $error) {
                throw $error;
            }
        });
    }

    public static function approveTransaction($transactionId, $approverId, $userRole) {
        return DB::transaction(function () use ($transactionId, $approverId, $userRole) {
            try {
                // Mencari Transaksi yang akan disetujui
                $transaction = Transaction::lockForUpdate()->find($transactionId);
                if (!$transaction) throw new \Exception('Transaksi Tidak Ditemukan');

                // Validasi Transaksi yang sudah ditolak atau dibatalkan
                if ($transaction->status === 'rejected') {
                    throw new \Exception("Transaksi dengan status {$transaction->status} tidak dapat disetujui");
                }

                $nextStatus = $transaction->status;

                // Logika hierarki approve
                if ($userRole === 'finance') {
                    if ($transaction->status !== 'pending') throw new \Exception('Hanya transaksi dengan status pending yang dapat disetujui');

                    if ($transaction->type === 'income') {
                        $nextStatus = 'approved';
                    } else {
                        $nextStatus = 'waiting_approval_a';
                    }
                } else if ($userRole === 'admin') {
                    if ($transaction->status !== 'waiting_approval_a') throw new \Exception('Hanya transaksi yang sudah disetujui finance yang dapat disetujui');
                    $nextStatus = 'approved';
                } else {
                    throw new \Exception('Role anda tidak memiliki izin untuk menyetujui transaksi');
                }

                // Menghitung saldo hanya jika status menjadi approved final
                $balanceBefore = (float)$transaction->balance_before;
                $balanceAfter = (float)$transaction->balance_after;

                if ($nextStatus === 'approved') {
                    $account = Account::lockForUpdate()->find($transaction->accountId);

                    if (!$account) throw new \Exception('Akun utama tidak ditemukan');

                    $amount = (float)$transaction->amount;
                    $balanceBefore = (float)$account->getRawOriginal('balance');

                    if ($transaction->type === 'income') {
                        $balanceAfter = $balanceBefore + $amount;
                    } else {
                        if ($balanceBefore < $amount) throw new \Exception('Saldo Tidak Mencukupi');
                        $balanceAfter = $balanceBefore - $amount;

                        if ($transaction->type === 'transfer') {
                            $toAccount = Account::lockForUpdate()->find($transaction->toAccountId);

                            if (!$toAccount) throw new \Exception('Akun Tujuan Tidak ditemukan');

                            $toAccount->update([
                                'balance' => (float)$toAccount->getRawOriginal('balance') + $amount
                            ]);
                        }
                    }

                    // Memperbarui saldo akun utama
                    $account->update(['balance' => $balanceAfter]);
                }

                // Memperbarui saldo akun
                $transaction->update([
                    'status' => $nextStatus,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'approvedBy' => $approverId
                ]);

                // Mencatat log audit
                AuditLogService::record($approverId, 'APPROVE_TRANSACTION', "Menyetujui transaksi ID {$transaction->reference_id}. Status sekarang: {$nextStatus}");

                return ['message' => "Berhasil! Status Sekarang {$nextStatus}", 'nextStatus' => $nextStatus];

            } catch (\Exception $error) {
                throw $error;
            }
        });
    }

    public static function rejectTransaction($transactionId, $approverId, $userRole) {
        return DB::transaction(function () use ($transactionId, $approverId, $userRole) {
            try {
                $transaction = Transaction::find($transactionId);
                if (!$transaction) throw new \Exception('Transaksi Tidak Ditemukan');

                if ($transaction->status === 'approved') throw new \Exception('Transaksi Sudah Final, hanya bisa dibatalkan');

                if ($userRole === 'finance') {
                    if ($transaction->status !== 'pending') throw new \Exception('Manager hanya bisa menolak transaksi berstatus pending');
                } else if ($userRole === 'admin') {
                    if ($transaction->status !== 'waiting_approval_a') throw new \Exception('Direktur hanya bisa menolak transaksi yang sudah disetujui oleh manager');
                } else {
                    throw new \Exception('Anda tidak memiliki izin untuk menolak transaksi');
                }

                $transaction->update([
                    'status' => 'rejected',
                    'approvedBy' => $approverId
                ]);

                // Mencatat log audit
                AuditLogService::record($approverId, 'REJECT_TRANSACTION', "Transaksi {$transaction->reference_id} ditolak oleh {$userRole}, status: 'rejected'");

                return ['message' => 'Transaksi telah ditolak'];
            } catch (\Exception $error) {
                throw $error;
            }
        });
    }

    public static function voidTransaction($transactionId, $approverId) {
        return DB::transaction(function () use ($transactionId, $approverId) {
            try {
                $transaction = Transaction::lockForUpdate()->find($transactionId);
                if (!$transaction) throw new \Exception('Transaksi Tidak Ditemukan');
                if ($transaction->status !== 'approved') throw new \Exception('Hanya transaksi dengan status approved yang dapat dibatalkan');

                $account = Account::lockForUpdate()->find($transaction->accountId);
                $amount = (float)$transaction->amount;
                $restoreBalance = (float)$account->getRawOriginal('balance');

                // Mengembalikan saldo berdasarkan tipe transaksi
                if ($transaction->type === 'income') {
                    $restoreBalance -= $amount;
                } else if ($transaction->type === 'expense' || $transaction->type === 'transfer') {
                    $restoreBalance += $amount;

                    if ($transaction->type === 'transfer') {
                        // Mengembalikan saldo akun tujuan
                        $targetAccount = Account::lockForUpdate()->find($transaction->toAccountId);
                        if ($targetAccount) {
                            $targetRestoreBalance = (float)$targetAccount->getRawOriginal('balance') - $amount;
                            $targetAccount->update(['balance' => $targetRestoreBalance]);
                        }
                    }
                }

                // Memperbarui saldo akun utama
                $account->update(['balance' => $restoreBalance]);

                // Memperbarui status transaksi menjadi void
                $transaction->update([
                    'status' => 'void',
                    'approvedBy' => $approverId
                ]);

                // Mencatat log audit
                AuditLogService::record($approverId, 'VOID_TRANSACTION', "Membatalkan transaksi ID {$transaction->reference_id} sebesar {$transaction->amount}");

                return ['message' => 'Transaksi berhasil dibatalkan', 'restoreBalance' => $restoreBalance];
            } catch (\Exception $error) {
                throw $error;
            }
        });
    }

    public static function updateTransaction($id, $userId, $userRole, $data) {
        try {
            // Admin/Finance bisa edit transaksi siapa saja, Staff hanya transaksi sendiri
            $transaction = Transaction::when(!in_array($userRole, ['admin', 'finance']), function ($query) use ($userId) {
                return $query->where('userId', $userId);
            })->find($id);

            if (!$transaction) throw new \Exception('Transaksi Tidak Ditemukan');

            // Staff hanya bisa edit transaksi pending
            // Admin/Finance bisa edit semua transaksi
            if ($userRole === 'staff' && $transaction->status !== 'pending') {
                throw new \Exception("Transaksi dengan status {$transaction->status} tidak dapat diubah");
            }

            // Jika sudah approved maka tidak bisa diedit
            if ($transaction->status === 'approved') throw new \Exception('Transaksi yang sudah disetujui tidak dapat diubah, Silahkan dibatalkan jika ingin');

            $allowedUpdates = [
                'amount' => $data['amount'] ?? $transaction->amount,
                'date' => $data['date'] ?? $transaction->date,
                'categoryId' => $data['categoryId'] ?? $transaction->categoryId,
                'accountId' => $data['accountId'] ?? $transaction->accountId,
                'type' => $data['type'] ?? $transaction->type,
                'toAccountId' => $data['toAccountId'] ?? $transaction->toAccountId,
                'description' => $data['description'] ?? $transaction->description,
                'evidence_link' => $data['evidence_link'] ?? $transaction->evidence_link,
            ];

            // Tentukan status: admin/finance bisa set status dari request, staff reset ke pending
            $newStatus = in_array($userRole, ['admin', 'finance'])
                ? ($data['status'] ?? $transaction->status)
                : 'pending';

            $transaction->update(array_merge($allowedUpdates, [
                'status' => $newStatus,
                'balance_before' => 0,
                'balance_after' => 0
            ]));

            // Mencatat log audit
            AuditLogService::record($userId, 'UPDATE_TRANSACTION', "Memperbarui transaksi ID {$transaction->reference_id}");

            // Ambil data lengkap dengan relasi untuk dikembalikan ke client
            return Transaction::with(['account', 'category', 'user'])->find($transaction->id);

        } catch (\Exception $error) {
            throw $error;
        }
    }

    // Membuat fungsi untuk mendapatkan semua transaksi dan Filter
    public static function getAllTransactions($userId, $role, $filters = []) {
        try {
            $startDate = $filters['startDate'] ?? null;
            $endDate = $filters['endDate'] ?? null;

            $query = Transaction::query();

            if (!in_array($role, ['admin', 'finance', 'auditor'])) {
                $query->where('userId', $userId);
            }

            // Filter tanggal
            if ($startDate && $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            $fields = ['accountId', 'categoryId', 'type', 'status'];
            foreach ($fields as $field) {
                if (!empty($filters[$field])) {
                $query->where($field, $filters[$field]);
                }
            }

            return $query->with(['account', 'category', 'user'])
                         ->orderBy('date', 'DESC')
                         ->orderBy('created_at', 'DESC')
                         ->get();

        } catch (\Exception $error) {
            throw $error;
        }
    }

    // Membuat fungsi untuk menghapus transaksi
    public static function deleteTransaction($id, $userId, $userRole) {
        return DB::transaction(function () use ($id, $userId, $userRole) {
            try {
                $query = Transaction::query();
                if ($userRole !== 'admin') {
                    $query->where('userId', $userId);
                }

                $transaction = $query->find($id);

                if (!$transaction) throw new \Exception('Transaksi Tidak Ditemukan');
                if ($transaction->status === 'approved') throw new \Exception('Transaksi sudah approved tidak boleh dihapus.');

                // Mencatat log audit
                AuditLogService::record($userId, 'DELETE_TRANSACTION', "Menghapus transaksi ID {$transaction->reference_id} (Status: {$transaction->status}) ");

                // Menghapus transaksi
                $transaction->delete();

                return ['message' => "Transaksi berhasil dihapus"];

            } catch (\Exception $error) {
                throw $error;
            }
        });
    }
}
