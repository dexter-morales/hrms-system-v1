<!DOCTYPE html>
<!DOCTYPE html>
      <html>
      <head>
          <title>Payslip</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .payslip { max-width: 800px; margin: auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .details { display: flex; justify-content: space-between; }
              .section { margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f4f4f4; }
          </style>
      </head>
      <body>
          <div class="payslip">
              <div class="header">
                  <h1>Payslip</h1>
                  <p>{{ $payroll->employee->first_name }} {{ $payroll->employee->last_name }}</p>
                  <p>Pay Period: {{ \Carbon\Carbon::parse($payroll->pay_period_start)->format('m/d/Y') }} - {{ \Carbon\Carbon::parse($payroll->pay_period_end)->format('m/d/Y') }}</p>
              </div>
              <div class="details">
                  <div>
                      <p><strong>Employee ID:</strong> {{ $payroll->employee->employee_id }}</p>
                      <p><strong>Position:</strong> {{ $payroll->employee->position->name }}</p>
                      <p><strong>Location:</strong> {{ $payroll->employee->site->name ?? '-' }}</p>
                  </div>
                  <div>
                      <p><strong>Pay Schedule:</strong> {{ $payroll->pay_schedule }}</p>
                      <p><strong>Basic Salary:</strong> ₱{{ number_format($payroll->employee->basic_salary, 2) }}</p>
                  </div>
              </div>
              <div class="section">
                  <h3>Earnings</h3>
                  <table class="table">
                      <tr><th>Description</th><th>Amount</th></tr>
                      <tr><td>Worked Days ({{ $payroll->total_working_days }})</td><td>₱{{ number_format(($payroll->total_working_days * ($payroll->employee->basic_salary / 26)), 2) }}</td></tr>
                      <tr><td>Allowance</td><td>₱{{ number_format($payroll->allowance, 2) }}</td></tr>
                      <tr><td>Holiday Pay</td><td>₱{{ number_format($payroll->holiday_pay, 2) }}</td></tr>
                      <tr><td>Overtime Pay</td><td>₱{{ number_format($payroll->overtime_pay, 2) }}</td></tr>
                      <tr><th>Gross Pay</th><th>₱{{ number_format($payroll->gross_pay, 2) }}</th></tr>
                  </table>
              </div>
              <div class="section">
                  <h3>Deductions</h3>
                  <table class="table">
                      <tr><th>Description</th><th>Amount</th></tr>
                      <tr><td>Withholding Tax</td><td>₱{{ number_format($payroll->withholding_tax, 2) }}</td></tr>
                      <tr><td>SSS</td><td>₱{{ number_format($payroll->sss_deduction, 2) }}</td></tr>
                      <tr><td>Philhealth</td><td>₱{{ number_format($payroll->philhealth_deduction, 2) }}</td></tr>
                      <tr><td>Pag-ibig</td><td>₱{{ number_format($payroll->pagibig_deduction, 2) }}</td></tr>
                      <tr><td>Absences</td><td>₱{{ number_format($payroll->absences_deduction, 2) }}</td></tr>
                      <tr><td>Lates/Undertime</td><td>₱{{ number_format($payroll->late_deduction, 2) }}</td></tr>
                      <tr><th>Net Pay</th><th>₱{{ number_format($payroll->net_pay, 2) }}</th></tr>
                  </table>
              </div>
          </div>
      </body>
      </html>