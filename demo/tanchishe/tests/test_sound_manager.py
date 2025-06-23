import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import pygame
from src.sound_manager import SoundManager

@pytest.fixture
def sound_manager():
    """创建SoundManager实例"""
    pygame.init()
    return SoundManager()

def test_initial_state(sound_manager):
    """测试初始状态"""
    assert sound_manager.sound_enabled == True
    assert sound_manager.music_enabled == True
    assert sound_manager.music_playing == False

def test_toggle_sound(sound_manager):
    """测试音效开关"""
    initial_state = sound_manager.sound_enabled
    
    # 测试切换音效
    new_state = sound_manager.toggle_sound()
    assert new_state == (not initial_state)
    assert sound_manager.sound_enabled == new_state
    
    # 再次切换
    final_state = sound_manager.toggle_sound()
    assert final_state == initial_state
    assert sound_manager.sound_enabled == initial_state

def test_toggle_music(sound_manager):
    """测试音乐开关"""
    initial_state = sound_manager.music_enabled
    
    # 测试切换音乐
    new_state = sound_manager.toggle_music()
    assert new_state == (not initial_state)
    assert sound_manager.music_enabled == new_state
    
    # 再次切换
    final_state = sound_manager.toggle_music()
    assert final_state == initial_state
    assert sound_manager.music_enabled == initial_state

def test_sound_effects(sound_manager):
    """测试音效播放方法"""
    # 禁用音效
    sound_manager.sound_enabled = False
    
    # 测试所有音效方法
    sound_manager.play_move_sound()
    sound_manager.play_eat_sound()
    sound_manager.play_crash_sound()
    sound_manager.play_menu_select_sound()
    
    # 启用音效
    sound_manager.sound_enabled = True
    
    # 再次测试所有音效方法
    sound_manager.play_move_sound()
    sound_manager.play_eat_sound()
    sound_manager.play_crash_sound()
    sound_manager.play_menu_select_sound()

def test_background_music(sound_manager):
    """测试背景音乐控制"""
    # 禁用音乐
    sound_manager.music_enabled = False
    sound_manager.play_background_music()
    assert sound_manager.music_playing == False
    
    # 启用音乐
    sound_manager.music_enabled = True
    sound_manager.play_background_music()
    assert sound_manager.music_playing == True
    
    # 停止音乐
    sound_manager.stop_background_music()
    assert sound_manager.music_playing == False 