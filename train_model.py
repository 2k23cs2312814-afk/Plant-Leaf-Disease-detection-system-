"""
Plant Leaf Disease Detection - Model Training & Export Script
Uses MobileNetV2 Transfer Learning with TensorFlow/Keras.
"""
import os
import json
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DISEASE_INFO_PATH = os.path.join(DATA_DIR, 'disease_info.json')

with open(DISEASE_INFO_PATH, 'r', encoding='utf-8') as f:
    DISEASE_KNOWLEDGE = json.load(f)

CLASS_NAMES = list(DISEASE_KNOWLEDGE.keys())
NUM_CLASSES = len(CLASS_NAMES)
IMG_SIZE = (224, 224)

def export_class_names():
    class_file = os.path.join(BASE_DIR, 'class_names.txt')
    with open(class_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(CLASS_NAMES))
    print(f"Exported {NUM_CLASSES} class names to {class_file}")

def build_mobilenetv2_model():
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, models
        
        print("Building MobileNetV2 Transfer Learning Architecture...")
        base_model = tf.keras.applications.MobileNetV2(
            input_shape=IMG_SIZE + (3,),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False

        inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
        x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
        x = base_model(x, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)
        
        model = tf.keras.Model(inputs, outputs)
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        model_path = os.path.join(BASE_DIR, 'plant_disease_model.keras')
        model.save(model_path)
        print(f"Model architecture successfully initialized and saved to {model_path}")
        return model
    except Exception as e:
        print(f"TensorFlow model compilation deferred: {e}")
        return None

if __name__ == '__main__':
    export_class_names()
    build_mobilenetv2_model()
