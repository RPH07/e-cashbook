<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        Log::info ('Data yang diterima: ', $request->all());

        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Mencari user berdasarkan email
            $user = User::where('email', $request->email)->first();

            if(!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Password'
                ], 401);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login Berhasil',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ]
                ]
            ], 200);

        } catch (\Exception $error){
            Log::error('Login Error: ', ['error' => $error->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat login',
            ], 500);
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Middleware berhasil! Kamu adalah user yang sah',
            'data' => $request->user()
        ], 200);
    }
}
