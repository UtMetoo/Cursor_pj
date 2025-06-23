# -*- coding: utf-8 -*-
import pygame
import sys
import logging
import time
from snake import Snake
from food import Food
from settings import Settings
from game_state import GameState
from ui_manager import UIManager
from sound_manager import SoundManager

# 配置日志
logging.basicConfig(level=logging.DEBUG,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('Game')

class Game:
    def __init__(self):
        pygame.init()
        self.settings = Settings()
        self.screen = pygame.display.set_mode((self.settings.screen_width, self.settings.screen_height))
        pygame.display.set_caption("贪吃蛇")
        
        self.snake = Snake()
        self.food = Food()
        self.game_state = GameState()
        self.ui_manager = UIManager(self)
        self.sound_manager = SoundManager()
        
        # 添加移动计时器
        self.last_move_time = time.time()
        self.move_delay = 1.0 / self.settings.snake_speed  # 移动间隔时间
        
        logger.info('游戏初始化完成')
        # 初始化时播放背景音乐
        self.sound_manager.play_background_music()

    def run_game(self):
        clock = pygame.time.Clock()
        while True:
            self._check_events()
            
            if self.game_state.is_playing():
                self._update_game()
            
            self._update_screen()
            clock.tick(self.settings.fps)

    def _check_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                self._check_keydown_events(event)
            elif event.type == pygame.MOUSEMOTION:
                # 更新按钮悬停状态
                mouse_pos = pygame.mouse.get_pos()
                self.ui_manager.update_button_states(mouse_pos)
            elif event.type == pygame.MOUSEBUTTONDOWN:
                # 处理鼠标点击
                mouse_pos = pygame.mouse.get_pos()
                self._handle_mouse_click(event, mouse_pos)

    def _handle_mouse_click(self, event, pos):
        """处理鼠标点击"""
        logger.debug(f'处理鼠标点击 - 位置: {pos}, 当前游戏状态: {self.game_state}')
        # 更新按钮状态
        self.ui_manager.update_button_states(pos)
        # 处理按钮点击
        action = self.ui_manager.handle_input(event, self.game_state)
        logger.debug(f'UI处理结果: {action}')
        
        if action:
            logger.info(f'执行动作: {action}')
            self.sound_manager.play_menu_select_sound()
            if action == 'start':
                self._start_new_game()
            elif action == 'resume':
                self.game_state.resume()
            elif action == 'restart':
                self._start_new_game()
            elif action == 'quit':
                logger.info('退出游戏')
                sys.exit()
            elif action == 'quit_to_menu':
                self.game_state.show_menu()
            elif action == 'high_scores':
                self.game_state.show_high_scores()

    def _check_keydown_events(self, event):
        if event.key == pygame.K_q:
            sys.exit()
        elif event.key == pygame.K_p:
            if self.game_state.is_playing():
                self.game_state.pause()
            else:
                self.game_state.resume()
                self.sound_manager.play_menu_select_sound()
        elif event.key == pygame.K_SPACE:
            if self.game_state.is_game_over():
                self._start_new_game()
                self.sound_manager.play_menu_select_sound()
        elif event.key == pygame.K_m:
            self.sound_manager.toggle_music()
            self.sound_manager.play_menu_select_sound()
        elif event.key == pygame.K_s:
            self.sound_manager.toggle_sound()
            self.sound_manager.play_menu_select_sound()
        
        # 只在游戏进行中处理方向键
        if self.game_state.is_playing():
            if event.key == pygame.K_RIGHT:
                self.snake.change_direction("RIGHT")
                self.sound_manager.play_move_sound()
            elif event.key == pygame.K_LEFT:
                self.snake.change_direction("LEFT")
                self.sound_manager.play_move_sound()
            elif event.key == pygame.K_UP:
                self.snake.change_direction("UP")
                self.sound_manager.play_move_sound()
            elif event.key == pygame.K_DOWN:
                self.snake.change_direction("DOWN")
                self.sound_manager.play_move_sound()

    def _start_new_game(self):
        """开始新游戏"""
        logger.info('开始新游戏')
        self.snake = Snake()
        self.food = Food()
        self.game_state.start()
        logger.debug('游戏状态已重置')

    def _update_game(self):
        """更新游戏状态"""
        current_time = time.time()
        # 检查是否到达移动时间
        if current_time - self.last_move_time >= self.move_delay:
            self.snake.move()
            self.last_move_time = current_time
            
            # 检查是否吃到食物
            if self.snake.check_food_collision(self.food):
                self.snake.grow()
                self.food.respawn(self.snake.body)
                self.game_state.increase_score()
                self.sound_manager.play_eat_sound()
            
            # 检查是否撞墙或撞到自己
            if self.snake.check_collision():
                self.game_state.game_over()
                self.sound_manager.play_crash_sound()

    def _update_screen(self):
        """更新屏幕显示"""
        self.screen.fill(self.settings.bg_color)
        
        # 绘制游戏元素
        if not self.game_state.is_menu():
            self.snake.draw(self.screen)
            self.food.draw(self.screen)
        
        # 绘制UI
        self.ui_manager.draw(self.screen, self.game_state)
        
        pygame.display.flip()

if __name__ == '__main__':
    game = Game()
    game.run_game() 