import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.regularizers import l1_l2
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Build the model
def build_model(input_dim):
    model = Sequential()
    model.add(Dense(12, input_dim=input_dim, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001)))
    model.add(Dropout(0.3))
    model.add(Dense(6, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001)))
    model.add(Dropout(0.3))
    model.add(Dense(1, activation='sigmoid'))
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy', tf.keras.metrics.AUC()])
    return model

  


def train_deadlock_model(df):
    df = pd.read_csv(file_path)
    file_path = 'deadlock_scenarios.csv'  
    df = pd.read_csv(file_path)
    df['Deadlock_Risk'] = np.random.randint(0, 2, size=len(df))

    # Encode categorical features
    label_encoders = {}
    for col in ['Process', 'Held_Resource', 'Requested_Resource']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    X = df[['Process', 'Held_Resource', 'Requested_Resource']]
    y = df['Deadlock_Risk']

    # Handle imbalance
    smote = SMOTE()
    X_res, y_res = smote.fit_resample(X, y)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_res)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_res, test_size=0.2, random_state=42)

    # Build model
    model = build_model(input_dim=X_train.shape[1])

    # Early stopping
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    # Train
    history = model.fit(X_train, y_train, epochs=50, batch_size=16, validation_split=0.2, callbacks=[early_stop], verbose=1)

    # Evaluate
    y_pred = model.predict(X_test).flatten()
    y_pred_labels = (y_pred > 0.5).astype(int)

    print("\nClassification Report:\n", classification_report(y_test, y_pred_labels))

    # Save model and preprocessing
    model.save('deadlock_model.h5')
    joblib.dump(scaler, 'scaler.pkl')
    joblib.dump(label_encoders, 'label_encoders.pkl')

    # Optional: Plot metrics
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title("Model Accuracy")
    plt.legend()
    plt.show()

    return model
