<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{

    public function run(): void
    {
       $accounts = [
            ['account_name' => 'Kas Tunai', 'account_type' => 'tabungan', 'balance' => 5000000],
            ['account_name' => 'Bank BCA', 'account_type' => 'tabungan', 'balance' => 15000000],
            ['account_name' => 'Giro Operasional', 'account_type' => 'giro', 'balance' => 25000000],
            ['account_name' => 'Demo Account Giro', 'account_type' => 'giro', 'balance' => 0],
       ];

       foreach ($accounts as $account) {
           Account::create($account);
       }
    }
}
