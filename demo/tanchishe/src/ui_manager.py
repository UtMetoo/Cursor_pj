# -*- coding: utf-8 -*-
import pygame
import os
from game_state import GameState
from settings import Settings
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('UI_Manager')

class Button:
    """按钮类"""
    def __init__(self, x, y, width, height, text, font, color=(255, 255, 255)):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.font = font
        self.color = color
        self.is_hovered = False
        logger.debug(f'创建按钮: {text}, 位置: ({x}, {y}), 大小: {width}x{height}')
        
    def draw(self, screen):
        """绘制按钮"""
        # 绘制按钮背景
        color = (min(self.color[0] + 50, 255),
                min(self.color[1] + 50, 255),
                min(self.color[2] + 50, 255)) if self.is_hovered else self.color
        pygame.draw.rect(screen, color, self.rect, 2)
        
        # 绘制按钮文本
        text_surface = self.font.render(self.text, True, color)
        text_rect = text_surface.get_rect(center=self.rect.center)
        screen.blit(text_surface, text_rect)
        
    def handle_event(self, event):
        """处理按钮事件"""
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = event.pos
            clicked = self.rect.collidepoint(mouse_pos)
            logger.debug(f'按钮 "{self.text}" 处理点击事件, 位置: {mouse_pos}, 在按钮区域内: {clicked}')
            return clicked
        return False

class UIManager:
    """UI管理器"""
    def __init__(self, game):
        """初始化UI管理器"""
        self.game = game
        self.settings = game.settings
        
        # 加载自定义字体
        font_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                'assets', 'fonts', 'WenQuanYiMicroHei.ttf')
        try:
            self.font = pygame.font.Font(font_path, 48)
            self.small_font = pygame.font.Font(font_path, 24)
            print(f"成功加载字体: {font_path}")
        except Exception as e:
            print(f"加载自定义字体失败: {e}")
            print("使用系统默认字体")
            # 尝试使用系统字体
            try:
                if os.name == 'posix':  # macOS 和 Linux
                    self.font = pygame.font.SysFont('PingFang SC', 48)
                    self.small_font = pygame.font.SysFont('PingFang SC', 24)
                elif os.name == 'nt':  # Windows
                    self.font = pygame.font.SysFont('Microsoft YaHei', 48)
                    self.small_font = pygame.font.SysFont('Microsoft YaHei', 24)
                else:
                    self.font = pygame.font.SysFont('Arial', 48)
                    self.small_font = pygame.font.SysFont('Arial', 24)
            except Exception as e:
                print(f"加载系统字体也失败: {e}")
                self.font = pygame.font.SysFont('Arial', 48)
                self.small_font = pygame.font.SysFont('Arial', 24)
        
        self.buttons = {
            'menu': {
                'start': Button(300, 200, 200, 50, '开始游戏', self.font),
                'high_scores': Button(300, 270, 200, 50, '最高分', self.font),
                'quit': Button(300, 340, 200, 50, '退出', self.font)
            },
            'pause': {
                'resume': Button(300, 200, 200, 50, '继续', self.font),
                'restart': Button(300, 270, 200, 50, '重新开始', self.font),
                'quit_to_menu': Button(300, 340, 200, 50, '返回主菜单', self.font)
            },
            'game_over': {
                'restart': Button(300, 270, 200, 50, '重新开始', self.font),
                'quit_to_menu': Button(300, 340, 200, 50, '返回主菜单', self.font)
            },
            'high_scores': {
                'back': Button(300, 400, 200, 50, '返回', self.font)
            }
        }
        
    def draw(self, screen, game_state):
        """绘制UI"""
        if game_state.is_menu():
            self._draw_menu(screen)
        elif game_state.is_paused():
            self._draw_pause_menu(screen)
            self._draw_score(screen, game_state.score)
        elif game_state.is_game_over():
            self._draw_game_over(screen, game_state.score)
        elif game_state.is_high_scores():
            self._draw_high_scores(screen, game_state.get_high_scores())
        elif game_state.is_playing():
            self._draw_score(screen, game_state.score)
    
    def _draw_menu(self, screen):
        """绘制主菜单"""
        screen.fill(self.settings.bg_color)
        title = self.font.render("贪吃蛇", True, self.settings.grid_color)
        title_rect = title.get_rect(center=(self.settings.screen_width // 2, 100))
        screen.blit(title, title_rect)
        
        for button in self.buttons['menu'].values():
            button.draw(screen)
    
    def _draw_pause_menu(self, screen):
        """绘制暂停菜单"""
        # 半透明背景
        overlay = pygame.Surface((self.settings.screen_width, self.settings.screen_height))
        overlay.fill(self.settings.bg_color)
        overlay.set_alpha(128)
        screen.blit(overlay, (0, 0))
        
        title = self.font.render("游戏暂停", True, self.settings.grid_color)
        title_rect = title.get_rect(center=(self.settings.screen_width // 2, 100))
        screen.blit(title, title_rect)
        
        for button in self.buttons['pause'].values():
            button.draw(screen)
    
    def _draw_game_over(self, screen, score):
        """绘制游戏结束界面"""
        # 半透明背景
        overlay = pygame.Surface((self.settings.screen_width, self.settings.screen_height))
        overlay.fill(self.settings.bg_color)
        overlay.set_alpha(128)
        screen.blit(overlay, (0, 0))
        
        title = self.font.render("游戏结束", True, self.settings.grid_color)
        title_rect = title.get_rect(center=(self.settings.screen_width // 2, 100))
        screen.blit(title, title_rect)
        
        score_text = self.font.render(f"得分: {score}", True, self.settings.grid_color)
        score_rect = score_text.get_rect(center=(self.settings.screen_width // 2, 170))
        screen.blit(score_text, score_rect)
        
        for button in self.buttons['game_over'].values():
            button.draw(screen)
    
    def _draw_high_scores(self, screen, high_scores):
        """绘制最高分榜"""
        title = self.font.render('最高分排行榜', True, self.settings.grid_color)
        title_rect = title.get_rect(center=(self.settings.screen_width // 2, 100))
        screen.blit(title, title_rect)
        
        if not high_scores:
            text = self.font.render('暂无记录', True, self.settings.grid_color)
            text_rect = text.get_rect(center=(self.settings.screen_width // 2, 200))
            screen.blit(text, text_rect)
        else:
            for i, score in enumerate(high_scores[:10]):
                text = self.small_font.render(f'第{i+1}名: {score}分', True, self.settings.grid_color)
                text_rect = text.get_rect(center=(self.settings.screen_width // 2, 150 + i * 30))
                screen.blit(text, text_rect)
        
        self.buttons['high_scores']['back'].draw(screen)
    
    def _draw_score(self, screen, score):
        """绘制分数"""
        score_text = self.small_font.render(f'得分: {score}', True, self.settings.grid_color)
        screen.blit(score_text, (10, 10))
    
    def update_button_states(self, mouse_pos):
        """更新按钮状态"""
        logger.debug(f'更新按钮状态 - 鼠标位置: {mouse_pos}')
        for menu_buttons in self.buttons.values():
            for name, button in menu_buttons.items():
                was_hovered = button.is_hovered
                button.is_hovered = button.rect.collidepoint(mouse_pos)
                if was_hovered != button.is_hovered:
                    logger.debug(f'按钮 "{name}" 在 {menu_buttons} 中的悬停状态改变: {button.is_hovered}')
    
    def handle_input(self, event, game_state):
        """处理UI输入"""
        logger.debug(f'处理UI输入 - 当前游戏状态: {game_state}')
        if game_state.is_menu():
            logger.debug('处理主菜单按钮')
            for name, button in self.buttons['menu'].items():
                if button.handle_event(event):
                    logger.info(f'主菜单按钮点击: {name}')
                    return name
        elif game_state.is_paused():
            logger.debug('处理暂停菜单按钮')
            for name, button in self.buttons['pause'].items():
                if button.handle_event(event):
                    logger.info(f'暂停菜单按钮点击: {name}')
                    return name
        elif game_state.is_game_over():
            logger.debug('处理游戏结束按钮')
            for name, button in self.buttons['game_over'].items():
                if button.handle_event(event):
                    logger.info(f'游戏结束按钮点击: {name}')
                    return name
        elif game_state.is_high_scores():
            logger.debug('处理最高分榜按钮')
            for name, button in self.buttons['high_scores'].items():
                if button.handle_event(event):
                    logger.info(f'最高分榜按钮点击: {name}')
                    return 'quit_to_menu'  # 从最高分榜返回主菜单
        return None 