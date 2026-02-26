<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{

    public function run(): void
    {
        $categories = [
            ['name' => 'Pendapatan Operasional', 'type' => 'income'],
            ['name' => 'Pendapatan Lain-Lain', 'type' => 'income'],
            ['name' => 'Beban Operasional', 'type' => 'expense'],
            ['name' => 'Beban Administrasi', 'type' => 'expense'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
