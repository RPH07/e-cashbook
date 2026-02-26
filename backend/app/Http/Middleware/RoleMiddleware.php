<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * * @param Request $request
     * @param Closure $next
     * @param string ...$allowedRoles
     * @return Response
     */
    public function handle(Request $request, Closure $next, ...$allowedRoles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'status' => 'fail',
                'message' => 'Akses Ditolak! Silahkan Login Kembali'
            ], 401);
        }

        if (!in_array($request->user()->role, $allowedRoles)) {
            return response()->json([
                'status' => 'fail',
                'message' => "Akses Ditolak! {$request->user()->role} tidak memiliki izin mengakses sumber daya ini"
            ], 403);
        }

        return $next($request);
    }
}
