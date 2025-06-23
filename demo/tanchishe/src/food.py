# -*- coding: utf-8 -*-
import random
import pygame
from src.settings import Settings


class Food:
    def __init__(self):
        """初始化食物"""
        self.settings = Settings()
        self.position = self.get_random_position([])
        self.color = (255, 0, 0)  # 红色

    def get_random_position(self, snake_body):
        """生成一个新的食物位置，确保不与蛇身重叠"""
        while True:
            x = random.randrange(0, self.settings.screen_width, self.settings.grid_size)
            y = random.randrange(0, self.settings.screen_height, self.settings.grid_size)
            position = (x, y)
            if position not in snake_body:
                return position

    def draw(self, screen):
        """绘制食物"""
        pygame.draw.rect(screen, self.color, 
                        (self.position[0], self.position[1], 
                         self.settings.grid_size, self.settings.grid_size))

    def respawn(self, snake_body):
        """重新生成食物位置"""
        self.position = self.get_random_position(snake_body)

    def check_collision(self, snake_head):
        """检查是否与蛇头碰撞"""
        return self.position == snake_head
