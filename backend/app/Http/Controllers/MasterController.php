<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use Illuminate\Http\Request;

class MasterController extends Controller
{
    public function getAllAccounts()
    {
        try {
            $accounts = Account::all();

            return response()->json([
                'status' => 'success',
                'data' => $accounts
            ], 200);
        } catch (\Exception $error) {
            return response()->json(['message' => $error->getMessage()], 500);
        }
    }

    public function getAllCategories()
    {
        try {
            $categories = Category::all();

            return response()->json([
                'status' => 'success',
                'data' => $categories
            ], 200);
        } catch (\Exception $error) {
            return response()->json(['message' => $error->getMessage()], 500);
        }
    }
}
