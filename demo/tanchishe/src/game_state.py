# -*- coding: utf-8 -*-
from enum import Enum, auto
import logging
import json
import os

# 配置日志
logger = logging.getLogger('GameState')

class GameState:
    """游戏状态管理类"""
    
    # 游戏状态常量
    MENU = 'MENU'
    PLAYING = 'PLAYING'
    PAUSED = 'PAUSED'
    GAME_OVER = 'GAME_OVER'
    HIGH_SCORES = 'HIGH_SCORES'  # 新增最高分状态
    
    def __init__(self):
        """初始化游戏状态"""
        self.state = self.MENU
        self.score = 0
        self.high_scores = self.load_high_scores()
        logger.info('游戏状态初始化为主菜单')
        
    def start(self):
        """开始游戏"""
        old_state = self.state
        self.state = self.PLAYING
        self.score = 0
        logger.info(f'游戏开始: 状态从 {old_state} 变为 {self.state}')
        
    def pause(self):
        """暂停游戏"""
        if self.state == self.PLAYING:
            old_state = self.state
            self.state = self.PAUSED
            logger.info(f'游戏暂停: 状态从 {old_state} 变为 {self.state}')
            
    def resume(self):
        """继续游戏"""
        if self.state == self.PAUSED:
            old_state = self.state
            self.state = self.PLAYING
            logger.info(f'继续游戏: 状态从 {old_state} 变为 {self.state}')
    
    def game_over(self):
        """游戏结束"""
        old_state = self.state
        self.state = self.GAME_OVER
        # 总是保存分数
        self.high_scores.append(self.score)
        self.high_scores.sort(reverse=True)
        self.high_scores = self.high_scores[:10]  # 只保留前10个最高分
        self.save_high_scores()
        logger.info(f'游戏结束: 状态从 {old_state} 变为 {self.state}, 最终得分: {self.score}')
    
    def show_menu(self):
        """显示主菜单"""
        old_state = self.state
        self.state = self.MENU
        logger.info(f'显示主菜单: 状态从 {old_state} 变为 {self.state}')

    def show_high_scores(self):
        """显示最高分榜"""
        old_state = self.state
        self.state = self.HIGH_SCORES
        logger.info(f'显示最高分榜: 状态从 {old_state} 变为 {self.state}')
    
    def increase_score(self):
        """增加分数"""
        old_score = self.score
        self.score += 1
        logger.debug(f'分数更新: {old_score} -> {self.score} (+1)')
    
    def is_menu(self):
        return self.state == self.MENU
    
    def is_playing(self):
        return self.state == self.PLAYING
    
    def is_paused(self):
        return self.state == self.PAUSED
    
    def is_game_over(self):
        return self.state == self.GAME_OVER

    def is_high_scores(self):
        return self.state == self.HIGH_SCORES

    def load_high_scores(self):
        """从文件加载最高分记录"""
        try:
            data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'high_scores.json')
            if os.path.exists(data_path):
                with open(data_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f'加载最高分失败: {e}')
        return []  # 如果文件不存在或加载失败，返回空列表

    def save_high_scores(self):
        """保存最高分记录到文件"""
        try:
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            os.makedirs(data_dir, exist_ok=True)
            data_path = os.path.join(data_dir, 'high_scores.json')
            with open(data_path, 'w') as f:
                json.dump(self.high_scores, f)
            logger.info('最高分保存成功')
        except Exception as e:
            logger.error(f'保存最高分失败: {e}')

    def get_highest_score(self):
        """获取最高分"""
        return max(self.high_scores) if self.high_scores else 0

    def get_high_scores(self):
        """获取所有最高分记录"""
        return self.high_scores

    def __str__(self):
        return f'GameState(state={self.state}, score={self.score})'

class GameStateEnum(Enum):
    """游戏状态枚举"""
    MENU = auto()          # 主菜单
    RUNNING = auto()       # 游戏运行中
    PAUSED = auto()        # 游戏暂停
    GAME_OVER = auto()     # 游戏结束
    HIGH_SCORES = auto()   # 高分榜 