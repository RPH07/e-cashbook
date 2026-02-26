<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;

// --- Public ---
Route::post('/login', [AuthController::class, 'login']);

// --- Private (Perlu Login) ---
Route::middleware('auth:sanctum')->group(function () {

    // Auth Me
    Route::get('/me', function (Illuminate\Http\Request $request) {
        return response()->json([
            'status' => 'success',
            'message' => 'Middleware Berhasil! Kamu Adalah User Sah',
            'user' => $request->user()
        ]);
    });

    // Master Data
    Route::get('/master/accounts', [MasterController::class, 'getAllAccounts']);
    Route::get('/master/categories', [MasterController::class, 'getAllCategories']);

    // Reports
    Route::get('/dashboard', [ReportController::class, 'getDashboardData']);
    Route::get('/audit-logs', [ReportController::class, 'getAuditLogs'])
        ->middleware('role:admin,finance,auditor');

    // Transactions
    Route::prefix('transactions')->group(function () {
        Route::get('/', [TransactionController::class, 'getAllTransaction']);
        Route::post('/', [TransactionController::class, 'createTransaction']);
        Route::put('/{id}', [TransactionController::class, 'updateTransaction']);
        Route::delete('/{id}', [TransactionController::class, 'deleteTransaction']);

        // Khusus Approval & Void
        Route::patch('/{id}/approve', [TransactionController::class, 'approveTransaction'])->middleware('role:admin,finance');
        Route::patch('/{id}/reject', [TransactionController::class, 'rejectTransaction'])->middleware('role:admin,finance');
        Route::patch('/{id}/void', [TransactionController::class, 'voidTransaction'])->middleware('role:admin,finance');
    });
});
