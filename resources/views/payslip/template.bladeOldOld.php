<!DOCTYPE html>
<html>
<head>
    <title>Payslip</title>
    <style type="text/css">
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; font-size: 12px; }
        .payslip { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 15px; }
        .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #000; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .info-table td { padding: 3px 5px; vertical-align: top; }
        .info-label { font-weight: bold; white-space: nowrap; }
        .table-container { width: 100%; border: 1px solid #000; margin-top: 10px; }
        .compensation-table { width: 100%; border-collapse: collapse; }
        .compensation-table th { text-align: left; padding: 5px; border-bottom: 1px solid #000; background-color: #f0f0f0; }
        .compensation-table td { padding: 5px; }
        .amount-column { text-align: right; width: 100px; }
        .deduction-column { text-align: right; width: 100px; }
        .totals { margin-top: 15px; }
        .total-row { margin-bottom: 5px; }
        .total-label { font-weight: bold; float: left; }
        .total-amount { font-weight: bold; float: right; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; }
        .clear { clear: both; }
    </style>
</head>
<body>
    <div class="payslip">

        <div class="header">
            <h2>{{$company_settings? $company_settings->company_name : 'Company Name'}}</h2>
            <h6>{{$company_settings? ($company_settings->address? $company_settings->address : 'Address here') : 'Address here'}}</h6>
        </div>
        
       <table class="info-table">
            <!-- First Row: Name and Position -->
            <tr>
                <td class="info-label" style="width: 15%;">NAME</td>
                <td style="width: 35%;">: {{ $payroll->employee->first_name }} {{ $payroll->employee->middle_name }} {{ $payroll->employee->last_name }}</td>
                <td class="info-label" style="width: 15%;">POSITION</td>
                <td style="width: 35%;">: {{ $payroll->employee->position->name ?? 'N/A' }}</td>
            </tr>
            <!-- Second Row: Employee ID and Employment Status -->
            <tr>
                <td class="info-label">EMPLOYEE ID</td>
                <td>: {{ $payroll->employee->employee_id }}</td>
                <td class="info-label">EMPLOYMENT STATUS</td>
                <td>: {{ ucfirst($payroll->employee->employment_status->name ?? 'Regular') }}</td>
            </tr>
            <!-- Third Row: Date Covered and Department -->
            <tr>
                <td class="info-label">DATE COVERED</td>
                <td>: Payroll for {{ date('m/d/Y', strtotime($payroll->pay_period_start)) }} - {{ date('m/d/Y', strtotime($payroll->pay_period_end)) }}</td>
                <td class="info-label">DEPARTMENT</td>
                <td>: {{ $payroll->employee->department->name ?? 'N/A' }}</td>
            </tr>
            <!-- Fourth Row: Payroll Date -->
            <tr>
                <td class="info-label">PAYROLL DATE</td>
                <td>: {{ date('d M Y', strtotime($payroll->created_at)) }}</td>
                <td colspan="2"></td>
            </tr>
        </table>
        
        <div class="table-container">
            <table class="compensation-table">
                <tr>
                    <th style="width: 40%;">COMPENSATION</th>
                    <th style="width: 60%;">DEDUCTIONS</th>
                </tr>
                <tr>
                    <td style="vertical-align: top; border-right: 1px solid #000;">
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>BASIC</td>
                                <td class="amount-column">{{ number_format($payroll->employee->basic_salary, 2) }}</td>
                            </tr>
                            <tr>
                                <td>OT-ND (09:00)</td>
                                <td class="amount-column">{{ number_format($payroll->overtime_pay, 2) }}</td>
                            </tr>
                            <tr>
                                <td>Allowance</td>
                                <td class="amount-column">{{ number_format($payroll->allowance, 2) }}</td>
                            </tr>
                            <tr>
                                <td>Holiday Pay</td>
                                <td class="amount-column">{{ number_format($payroll->holiday_pay, 2) }}</td>
                            </tr>
                        </table>
                    </td>
                    <td style="vertical-align: top;">
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td>LATE/UNDERTIME ({{ $payroll->late_hours }}h)</td>
                                <td class="deduction-column">{{ number_format($payroll->late_deduction, 2) }}</td>
                            </tr>
                            <tr>
                                <td>ABSENCES ({{ $payroll->total_absences }}d)</td>
                                <td class="deduction-column">{{ number_format($payroll->absences_deduction, 2) }}</td>
                            </tr>
                            <tr>
                                <td>CASH ADVANCE</td>
                                <td class="deduction-column">0.00</td>
                            </tr>
                            <tr>
                                <td>SSS</td>
                                <td class="deduction-column">{{ number_format($payroll->sss_deduction, 2) }}</td>
                            </tr>
                            <tr>
                                <td>PHILHEALTH</td>
                                <td class="deduction-column">{{ number_format($payroll->philhealth_deduction, 2) }}</td>
                            </tr>
                            <tr>
                                <td>HDMF</td>
                                <td class="deduction-column">{{ number_format($payroll->pagibig_deduction, 2) }}</td>
                            </tr>
                            <tr>
                                <td>TAX</td>
                                <td class="deduction-column">{{ number_format($payroll->withholding_tax, 2) }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="totals">
            <div class="total-row">
                <div class="total-label">TOTAL COMPENSATION</div>
                <div class="total-amount">{{ number_format($payroll->gross_pay, 2) }}</div>
                <div class="clear"></div>
            </div>
            <div class="total-row">
                <div class="total-label">TOTAL DEDUCTIONS</div>
                <div class="total-amount">{{ number_format($payroll->deductions, 2) }}</div>
                <div class="clear"></div>
            </div>
            <div class="total-row">
                <div class="total-label">NET PAY</div>
                <div class="total-amount">{{ number_format($payroll->net_pay, 2) }}</div>
                <div class="clear"></div>
            </div>
        </div>
        
        {{-- <div class="footer">
            <p>This payslip is computer generated and does not require a signature.</p>
            <p>Approved by: Admin</p>
        </div> --}}
    </div>
</body>
</html>