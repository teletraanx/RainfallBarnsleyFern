# cleandata.py: fills monthly NA values using subdivision means and recalculate summary columns

import pandas as pd

# Load dataset
df = pd.read_csv('RainfallData.csv')  

# List of monthly columns
monthly_cols = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

# Fill NA values in monthly data using subdivision-wise mean
df[monthly_cols] = df.groupby('SUBDIVISION')[monthly_cols].transform(
    lambda group: group.fillna(group.mean())
)

# Recalculate summary/seasonal columns to ensure accuracy
df['ANNUAL'] = df[monthly_cols].sum(axis=1)
df['JF'] = df[['JAN', 'FEB']].sum(axis=1)
df['MAM'] = df[['MAR', 'APR', 'MAY']].sum(axis=1)
df['JJAS'] = df[['JUN', 'JUL', 'AUG', 'SEP']].sum(axis=1)
df['OND'] = df[['OCT', 'NOV', 'DEC']].sum(axis=1)

# Round to 2 decimal places
df = df.round(2)

# Save cleaned version to a new CSV
df.to_csv('RainfallDataClean.csv', index=False)

