<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>13th Month Pay Report - Year {{ $year }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 2.54cm; /* 1 inch in cm */
            font-size: 12pt;
        }
        h1 {
            text-align: center;
            font-size: 18pt;
            margin-bottom: 1em;
        }
        h2 {
            font-size: 14pt;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        p {
            margin: 0.5em 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1em;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .total {
            font-weight: bold;
            font-size: 11pt;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    {{-- <h1>13th Month Pay Report - Year {{ $year }}</h1> --}}
    @forelse ($reportData as $data)
        <h2>Name: {{ htmlspecialchars($data['employee']['name'], ENT_QUOTES, 'UTF-8') }}</h2>
        <p>Employee ID: {{ htmlspecialchars($data['employee']['employee_id'], ENT_QUOTES, 'UTF-8') }}</p>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Basic Earnings</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data['monthly_earnings'] as $entry)
                    <tr>
                        <td>{{ htmlspecialchars($entry['month'], ENT_QUOTES, 'UTF-8') }}</td>
                        <td>{{ number_format(floatval($entry['earnings']), 2, '.', ',') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <p class="total">Total Basic Earnings: {{ number_format(floatval($data['total_basic_earnings']), 2, '.', ',') }}</p>
        <p>Divide by: 12 months</p>
        <p class="total">Prorated 13th Month Pay: {{ number_format(floatval($data['thirteenth_month_pay']), 2, '.', ',') }}</p>
        @if (!$loop->last)
            <div class="page-break"></div>
        @endif
    @empty
        <p>No data available for the selected year.</p>
    @endforelse
</body>
</html>