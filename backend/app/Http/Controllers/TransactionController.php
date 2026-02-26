<?php

namespace App\Http\Controllers;

use App\Services\TransactionService;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    // Controller untuk membuat transaksi baru
    public function createTransaction(Request $request)
    {
        try {
            $data = $request->all();

            // Validasi input dasar
            if (!$request->date || !$request->amount || !$request->accountId || !$request->type) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data Tidak Lengkap, Pastikan Tanggal, Jumlah, Akun, dan Tipe Terisi'
                ], 400);
            }

            // Validasi transfer
            if ($request->type === 'transfer' && !$request->toAccountId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Untuk transfer, Akun Tujuan Harus Diisi'
                ], 400);
            }

            // Memanggil service untuk membuat transaksi
            $transaction = TransactionService::createTransaction(array_merge($data, [
                'userId' => $request->user()->id
            ]));

            return response()->json([
                'success' => true,
                'message' => "Transaksi {$request->type} Berhasil Dibuat",
                'data' => $transaction
            ], 201);

        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 500);
        }
    }

    public function getAllTransaction(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $role = $request->user()->role;
            $filters = $request->query();

            $data = TransactionService::getAllTransactions($userId, $role, $filters);

            return response()->json([
                'success' => true,
                'message' => 'Riwayat Transaksi Berhasil Diambil',
                'data' => $data
            ], 200);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 500);
        }
    }

    public function updateTransaction(Request $request, $id)
    {
        try {
            $result = TransactionService::updateTransaction($id, $request->user()->id, $request->user()->role, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Transaksi Berhasil Diperbarui',
                'data' => $result
            ], 200);

        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 400);
        }
    }

    public function approveTransaction(Request $request, $id)
    {
        try {
            $result = TransactionService::approveTransaction($id, $request->user()->id, $request->user()->role);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi Berhasil Disetujui',
                'data' => $result
            ], 200);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 400);
        }
    }

    public function rejectTransaction(Request $request, $id)
    {
        try {
            $result = TransactionService::rejectTransaction($id, $request->user()->id, $request->user()->role);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi Berhasil Ditolak',
                'data' => $result
            ], 200);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 400);
        }
    }

    public function voidTransaction(Request $request, $id)
    {
        try {
            $result = TransactionService::voidTransaction($id, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi Berhasil Dibatalkan',
                'data' => $result
            ], 200);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 400);
        }
    }

    public function deleteTransaction(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;
            $result = TransactionService::deleteTransaction($id, $userId, $request->user()->role);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ], 200);
        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 400);
        }
    }
}
