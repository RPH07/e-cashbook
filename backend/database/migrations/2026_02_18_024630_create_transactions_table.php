<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2)->default(0);
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->string('reference_id')->nullable();
            $table->enum('type', ['income', 'expense', 'transfer']);
            $table->text('description');
            $table->string('evidence_link')->nullable();
            $table->enum('status', ['pending', 'void', 'approved', 'rejected', 'waiting_approval_a'])->default('pending');
            $table->foreignId('userId')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approvedBy')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('accountId')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('categoryId')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('toAccountId')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
