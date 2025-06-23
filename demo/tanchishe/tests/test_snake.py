import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.snake import Snake
from src.settings import GRID_SIZE, WINDOW_WIDTH, WINDOW_HEIGHT, SNAKE_INIT_LENGTH, RIGHT

def test_snake_initial_position():
    """测试蛇的初始位置是否正确"""
    snake = Snake()
    assert len(snake.body) == SNAKE_INIT_LENGTH
    assert snake.body[0][0] >= 0 and snake.body[0][0] < WINDOW_WIDTH
    assert snake.body[0][1] >= 0 and snake.body[0][1] < WINDOW_HEIGHT

def test_snake_movement():
    """测试蛇的移动功能"""
    snake = Snake()
    initial_pos = snake.body[0]
    
    # 测试向右移动
    snake.direction = RIGHT
    snake.move()
    assert snake.body[0][0] == initial_pos[0] + GRID_SIZE
    assert snake.body[0][1] == initial_pos[1]

def test_snake_growth():
    """测试蛇的生长功能"""
    snake = Snake()
    initial_length = len(snake.body)
    snake.grow()
    snake.move()  # 需要移动一次才会实际增长
    assert len(snake.body) == initial_length + 1

def test_snake_collision_with_self():
    """测试蛇与自身碰撞的检测"""
    snake = Snake()
    # 模拟蛇生长
    snake.grow()
    snake.grow()
    # 强制设置蛇的身体部分与头部重叠
    snake.body.append(snake.body[0])
    assert snake.check_collision() == True 