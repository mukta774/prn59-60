import pandas as pd
import numpy as np
import os
from tkinter import Tk , filedialog

print(" ----- This is Automated_EDA.py ----- \n")
print("This script is designed to perform automated exploratory data analysis (EDA) on a dataset.\n")
print("It includes data loading, preprocessing, visualization, and basic statistical analysis.\n")
print("Ensure that the necessary libraries are installed and the dataset is accessible in the same folder as this file .\n")

def load_file():
  root = Tk()
  root.withdraw() #Creates a Tkinter root window, but immediately hides it with .withdraw().

# Open the file dialog, what can the filedialog do really ?
  file_path = filedialog.askopenfilename(
    title="Select CSV file",
    filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
)

  if file_path:
    df = pd.read_csv(file_path)
    print("File loaded successfully!")
    print(df.head())
  else:
    print("No file selected.")
    
  print("Before processing the dataset contains :",df.shape)
  print("\nSummary statistics:\n", df.describe())

  
def processing(df):
  features = df.columns.tolist()
  print("\nAvailable features in the dataset:", features)
  for feature in features:
    if df[feature].dtype == 'object': # Check if the feature is of type object (text or string)
      df[feature] = df[feature].astype('category')#Converts the column to 'category' type. Because categorical dtype uses less memory, more semantically accurate 
# It can improve performance in some operations 
      
    print(f"\nFeature: {feature}")
    print("Data type:", df[feature].dtype)
    print("Unique values:", df[feature].nunique())
    print("Missing values:", df[feature].isnull().sum())
    print("Sample data:\n", df[feature].sample(5))
    print("Dulplicate values:", df[feature].duplicated().sum())
    df.drop_duplicates(inplace = True)

  for column in df.columns:
    if df[column].dtype in ['int64', 'float64']:
        mean_value = df[column].mean()
        df[column].fillna(mean_value, inplace=True)
        print(f"Filled missing values in numeric column '{column}' with mean: {mean_value}")
    
    elif df[column].dtype == 'object' or pd.api.types.is_categorical_dtype(df[column]):
        mode_value = df[column].mode()[0]  # mode() returns a Series
        df[column].fillna(mode_value, inplace=True)
        print(f"Filled missing values in text column '{column}' with mode: {mode_value}")

  print("After processing, the dataset contains:")
  print("\nNo of (columns, rows) in the dataset:", df.shape)
  print("Summary statistics:\n", df.describe())
  
if __name__ == "__main__":
    load_file()
    
    # Assuming df is the DataFrame loaded from the CSV file
    df = pd.read_csv('diabetes.csv')  # Replace with the actual path to your dataset
    processing(df)
    
    print("\nAutomated EDA completed successfully!")