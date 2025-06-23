# -*- coding: utf-8 -*-
import pygame
from src.settings import Settings

class Snake:
    def __init__(self):
        """初始化蛇的属性"""
        self.settings = Settings()

        # 初始化蛇的位置（屏幕中心）
        self.body = [(self.settings.screen_width // 2,
                     self.settings.screen_height // 2)]

        # 初始方向为右
        self.direction = 'RIGHT'
        self.next_direction = self.direction
        self.color = (0, 255, 0)  # 绿色
        self.is_growing = False

    def move(self):
        """移动蛇"""
        # 更新方向
        self.direction = self.next_direction
        
        # 获取当前头部位置
        x, y = self.body[0]
        
        # 根据方向移动
        if self.direction == 'RIGHT':
            x += self.settings.grid_size
        elif self.direction == 'LEFT':
            x -= self.settings.grid_size
        elif self.direction == 'UP':
            y -= self.settings.grid_size
        elif self.direction == 'DOWN':
            y += self.settings.grid_size
        
        # 在头部添加新位置
        self.body.insert(0, (x, y))

        # 移除尾部（除非正在生长）
        if not self.is_growing:
            self.body.pop()
        else:
            self.is_growing = False

    def change_direction(self, new_direction):
        """改变方向"""
        # 防止180度转向
        opposite_directions = {
            'RIGHT': 'LEFT',
            'LEFT': 'RIGHT',
            'UP': 'DOWN',
            'DOWN': 'UP'
        }
        
        # 只有当新方向不是当前方向的反方向时才更新next_direction
        if new_direction != opposite_directions.get(self.direction):
            self.next_direction = new_direction

    def grow(self):
        """让蛇生长"""
        self.is_growing = True

    def check_collision(self):
        """检查碰撞"""
        head = self.body[0]

        # 检查是否撞墙
        if (head[0] < 0 or head[0] >= self.settings.screen_width or
            head[1] < 0 or head[1] >= self.settings.screen_height):
            return True

        # 检查是否撞到自己
        if head in self.body[1:]:
            return True

        return False

    def get_head_position(self):
        """获取蛇头位置"""
        return self.body[0]

    def check_food_collision(self, food):
        """检查是否吃到食物"""
        return self.get_head_position() == food.position

    def draw(self, screen):
        """绘制蛇"""
        for segment in self.body:
            pygame.draw.rect(screen, self.color,
                           (segment[0], segment[1],
                            self.settings.grid_size - 2,
                            self.settings.grid_size - 2)) 