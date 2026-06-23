import os
import glob
from rembg import remove
from PIL import Image

def process_dir(directory):
    files = glob.glob(os.path.join(directory, '*.png')) + glob.glob(os.path.join(directory, '*.jpg'))
    for f in files:
        print(f"Processing {f}...")
        try:
            input_image = Image.open(f)
            output_image = remove(input_image)
            output_image.save(f, format="PNG")
        except Exception as e:
            print(f"Error processing {f}: {e}")

if __name__ == "__main__":
    process_dir('public/botanicals')
    process_dir('public/textures')
    print("Done")
