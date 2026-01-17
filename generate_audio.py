import wave
import random
import struct

def generate_white_noise(filename="white_noise.wav", duration=5.0, sample_rate=44100):
    num_samples = int(duration * sample_rate)
    amplitude = 16000  # -32768 to 32767 for 16-bit audio

    with wave.open(filename, 'w') as wav_file:
        # Set parameters: 1 channel (mono), 2 bytes per sample (16-bit), sample rate
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        
        for _ in range(num_samples):
            # Generate random value for white noise
            value = random.randint(-amplitude, amplitude)
            # Pack value as short (16-bit signed integer)
            data = struct.pack('<h', value)
            wav_file.writeframes(data)

    print(f"Generated {filename}")

if __name__ == "__main__":
    generate_white_noise(r"d:\code_here\PROJECTS\PrismEcho\frontend\public\white_noise.wav")
