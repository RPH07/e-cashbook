<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public static function getDashboardSummary($userId, $role)
    {
        try {
            // Tentukan kondisi filter berdasarkan role
            $isPrivileged = in_array($role, ['admin', 'auditor']);

            // Query Account untuk mendapatkan total saldo per tipe
            $accountQuery = Account::query();
            if (!$isPrivileged) {
                $accountQuery->where('userId', $userId);
            }

            $accounts = $accountQuery->select(
                'account_type',
                DB::raw('SUM(balance) as total_balance')
            )
            ->groupBy('account_type')
            ->get();

            $tabungan = 0;
            $giro = 0;

            foreach ($accounts as $acc) {
                $total = (float)$acc->total_balance;
                if ($acc->account_type === 'tabungan') $tabungan = $total;
                if ($acc->account_type === 'giro') $giro = $total;
            }

            // Query Transaction untuk summary per tipe (income/expense/transfer)
            $transactionQuery = Transaction::where('status', 'approved');
            if (!$isPrivileged) {
                $transactionQuery->where('userId', $userId);
            }

            $summary = $transactionQuery->select(
                'type',
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('type')
            ->get();

            return [
                'saldo_tabungan' => $tabungan,
                'saldo_giro' => $giro,
                'saldo_total' => $tabungan + $giro,
                'summary' => $summary
            ];

        } catch (\Exception $error) {
            throw $error;
        }
    }
}
