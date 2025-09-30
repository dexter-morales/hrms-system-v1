<?php

namespace Database\Factories;

use App\Models\AttendanceLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @template TModel of \App\Models\AttendanceLog
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<TModel>
 */
class AttendanceLogFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<TModel>
     */
    protected $model = AttendanceLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            //
        ];
    }
}
