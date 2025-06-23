import os
import pygame

class SoundManager:
    """音效管理器"""
    def __init__(self):
        """初始化音效管理器"""
        pygame.mixer.init()
        self.sounds = {}
        self.background_music = None
        self.load_sounds()
        self.music_playing = False
        self.sound_enabled = True
        self.music_enabled = True
        
        # 设置音效音量
        pygame.mixer.set_num_channels(8)  # 设置混音通道数
        
    def load_sounds(self):
        """加载所有音效"""
        sound_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'sounds')
        
        # 加载音效
        sound_files = {
            'move': 'move.wav',
            'eat': 'eat.wav',
            'crash': 'crash.wav',
            'menu_select': 'menu_select.wav'
        }
        
        for sound_name, filename in sound_files.items():
            filepath = os.path.join(sound_dir, filename)
            if os.path.exists(filepath):
                self.sounds[sound_name] = pygame.mixer.Sound(filepath)
        
        # 加载背景音乐
        background_path = os.path.join(sound_dir, 'background.wav')
        if os.path.exists(background_path):
            self.background_music = background_path
        
    def play_sound(self, sound_name):
        """播放指定音效"""
        if not self.sound_enabled:
            return
            
        if sound_name in self.sounds:
            self.sounds[sound_name].play()
    
    def play_background_music(self):
        """播放背景音乐"""
        if not self.music_enabled or not self.background_music:
            return
            
        pygame.mixer.music.load(self.background_music)
        pygame.mixer.music.play(-1)  # -1表示循环播放
        self.music_playing = True
    
    def stop_background_music(self):
        """停止背景音乐"""
        if self.music_playing:
            pygame.mixer.music.stop()
            self.music_playing = False
    
    def toggle_sound(self):
        """切换音效开关"""
        self.sound_enabled = not self.sound_enabled
        return self.sound_enabled
    
    def toggle_music(self):
        """切换音乐开关"""
        self.music_enabled = not self.music_enabled
        if self.music_enabled:
            self.play_background_music()
        else:
            self.stop_background_music()
        return self.music_enabled

    def play_move_sound(self):
        """播放移动音效"""
        self.play_sound('move')

    def play_eat_sound(self):
        """播放吃食物音效"""
        self.play_sound('eat')

    def play_crash_sound(self):
        """播放碰撞音效"""
        self.play_sound('crash')

    def play_menu_select_sound(self):
        """播放菜单选择音效"""
        self.play_sound('menu_select') 