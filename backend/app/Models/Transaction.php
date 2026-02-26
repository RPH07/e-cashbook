<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'date',
        'amount',
        'balance_before',
        'balance_after',
        'reference_id',
        'type',
        'description',
        'evidence_link',
        'status',
        'userId',
        'approvedBy',
        'accountId',
        'categoryId',
        'toAccountId',
    ];

    public function user(){
        return $this->belongsTo(User::class, 'userId');
    }

    public function approver(){
        return $this->belongsTo(User::class, 'approvedBy');
    }

    public function account(){
        return $this->belongsTo(Account::class, 'accountId');
    }

    public function category(){
        return $this->belongsTo(Category::class, 'categoryId');
    }

    public function toAccount(){
        return $this->belongsTo(Account::class, 'toAccountId');
    }
}
