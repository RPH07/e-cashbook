<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function getDashboardData(Request $request)
    {
        try {
            $summary = ReportService::getDashboardSummary($request->user()->id, $request->user()->role);

            return response()->json([
                'success' => true,
                'message' => 'Data Dashboard Berhasil Diambil',
                'data' => $summary
            ], 200);

        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 500);
        }
    }

    public function getAuditLogs(Request $request)
    {
        try {
            // Cek permission role
            if (!in_array($request->user()->role, ['admin', 'auditor', 'finance'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya admin, auditor dan finance yang dapat mengakses log audit.'
                ], 403);
            }

            // Ambil data log dengan relasi user
            $logs = AuditLog::with(['user' => function($query) {
                $query->select('id', 'name', 'role');
            }])
            ->orderBy('created_at', 'DESC')
            ->get();

            return response()->json([
                'success' => true,
                'message' => 'Log Audit Berhasil Diambil',
                'data' => $logs
            ], 200);

        } catch (\Exception $error) {
            return response()->json([
                'success' => false,
                'message' => $error->getMessage()
            ], 500);
        }
    }
}
