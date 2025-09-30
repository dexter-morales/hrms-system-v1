<?php

namespace Database\Factories;

use App\Models\EmployeeSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @template TModel of \App\Models\EmployeeSchedule
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<TModel>
 */
class EmployeeScheduleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<TModel>
     */
    protected $model = EmployeeSchedule::class;

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
