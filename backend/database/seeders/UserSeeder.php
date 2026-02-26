<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{

    public function run(): void
    {
        $users = [
            ['name' => 'admin', 'email' => 'admin@example.com', 'password' => Hash::make('123456'), 'role' => 'admin'],
            ['name' => 'finance', 'email' => 'finance@example.com', 'password' => Hash::make('finance123'), 'role' => 'finance'],
            ['name' => 'staff', 'email' => 'staff@example.com', 'password' => Hash::make('staff123'), 'role' => 'staff'],
            ['name' => 'auditor', 'email' => 'audit@example.com', 'password' => Hash::make('audit123'), 'role' => 'auditor'],
            ['name' => 'direktur keuangan', 'email' => 'direktur@example.com', 'password' => Hash::make('direktur123'), 'role' => 'admin'],
            ['name' => 'manager keuangan', 'email' => 'manager@example.com', 'password' => Hash::make('manager123'), 'role' => 'finance'],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}
