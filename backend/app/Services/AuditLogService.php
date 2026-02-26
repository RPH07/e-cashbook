<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogService {
    public static function record($userId, $action, $details) {
        try {
            AuditLog::create([
                'userId' => $userId,
                'action' => $action,
                'details' => $details
            ]);
        } catch (\Exception $error) {
            throw new \Exception('Gagal merekam log audit: ' . $error->getMessage());
        }
    }
}
