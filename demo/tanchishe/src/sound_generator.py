import os
import numpy as np
import pygame
from pygame.sndarray import make_sound
from pygame import mixer
from scipy.io import wavfile

def ensure_sound_directory():
    """确保音效目录存在"""
    sound_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'sounds')
    if not os.path.exists(sound_dir):
        os.makedirs(sound_dir)
    return sound_dir

def generate_move_sound():
    """生成移动音效 - 短促的滑动声"""
    sample_rate = 44100
    duration = 0.1  # 100ms
    t = np.linspace(0, duration, int(sample_rate * duration))
    frequency = 440  # 基础频率
    
    # 生成一个快速衰减的正弦波
    wave = np.sin(2 * np.pi * frequency * t) * np.exp(-10 * t)
    
    # 将波形转换为16位整数并创建立体声
    wave = np.int16(wave * 32767)
    stereo = np.ascontiguousarray(np.vstack((wave, wave)).T)
    return sample_rate, stereo

def generate_eat_sound():
    """生成吃食物音效 - 清脆的咬声"""
    sample_rate = 44100
    duration = 0.15
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 组合两个频率
    frequency1 = 880
    frequency2 = 1320
    wave = np.sin(2 * np.pi * frequency1 * t) + np.sin(2 * np.pi * frequency2 * t)
    
    # 添加快速衰减
    wave *= np.exp(-15 * t)
    
    # 标准化并转换为16位整数，创建立体声
    wave = np.int16(wave * 32767 / max(abs(wave)))
    stereo = np.ascontiguousarray(np.vstack((wave, wave)).T)
    return sample_rate, stereo

def generate_crash_sound():
    """生成碰撞音效 - 低沉的撞击声"""
    sample_rate = 44100
    duration = 0.2
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 生成噪声和低频正弦波的组合
    noise = np.random.rand(len(t))
    sine = np.sin(2 * np.pi * 220 * t)
    wave = noise * sine
    
    # 添加衰减
    wave *= np.exp(-10 * t)
    
    # 标准化并转换为16位整数，创建立体声
    wave = np.int16(wave * 32767 / max(abs(wave)))
    stereo = np.ascontiguousarray(np.vstack((wave, wave)).T)
    return sample_rate, stereo

def generate_menu_select_sound():
    """生成菜单选择音效 - 清脆的点击声"""
    sample_rate = 44100
    duration = 0.08
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 从高频到低频的快速扫频
    frequency = 1500 * np.exp(-20 * t)
    wave = np.sin(2 * np.pi * frequency * t)
    
    # 添加快速衰减
    wave *= np.exp(-20 * t)
    
    # 标准化并转换为16位整数，创建立体声
    wave = np.int16(wave * 32767 / max(abs(wave)))
    stereo = np.ascontiguousarray(np.vstack((wave, wave)).T)
    return sample_rate, stereo

def generate_background_music():
    """生成简单的背景音乐 - 循环的环境音"""
    sample_rate = 44100
    duration = 5.0  # 5秒循环
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # 生成三个不同频率的正弦波
    wave1 = np.sin(2 * np.pi * 220 * t)  # A3
    wave2 = np.sin(2 * np.pi * 277.18 * t)  # C#4
    wave3 = np.sin(2 * np.pi * 329.63 * t)  # E4
    
    # 添加缓慢的振幅调制
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * t)
    wave = (wave1 + wave2 + wave3) * mod * 0.3
    
    # 标准化并转换为16位整数，创建立体声
    wave = np.int16(wave * 32767 / max(abs(wave)))
    stereo = np.ascontiguousarray(np.vstack((wave, wave)).T)
    return sample_rate, stereo

def save_sound(sample_rate, wave, filename):
    """保存音效文件"""
    wavfile.write(filename, sample_rate, wave)

def generate_all_sounds():
    """生成所有音效"""
    pygame.mixer.init()
    sound_dir = ensure_sound_directory()
    
    # 生成并保存所有音效
    sounds = {
        'move.wav': generate_move_sound(),
        'eat.wav': generate_eat_sound(),
        'crash.wav': generate_crash_sound(),
        'menu_select.wav': generate_menu_select_sound()
    }
    
    for filename, (sample_rate, wave) in sounds.items():
        filepath = os.path.join(sound_dir, filename)
        save_sound(sample_rate, wave, filepath)
        print(f"已生成音效: {filename}")
    
    # 生成并保存背景音乐
    sample_rate, background_wave = generate_background_music()
    background_path = os.path.join(sound_dir, 'background.wav')
    save_sound(sample_rate, background_wave, background_path)
    print("已生成背景音乐: background.wav")

if __name__ == '__main__':
    generate_all_sounds() 