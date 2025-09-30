<?php

namespace Database\Factories;

use App\Models\EmployeeAttendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @template TModel of \App\Models\EmployeeAttendance
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<TModel>
 */
class EmployeeAttendanceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<TModel>
     */
    protected $model = EmployeeAttendance::class;

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
