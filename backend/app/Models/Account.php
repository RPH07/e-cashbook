<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = [
        'account_name',
        'account_type',
        'balance',
    ];

    public function transactions(){
        return $this->hasMany(Transaction::class, 'accountId');
    }
}
