import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.food import Food
from src.settings import GRID_SIZE, WINDOW_WIDTH, WINDOW_HEIGHT

def test_food_initial_position():
    """测试食物的初始位置是否在有效范围内"""
    food = Food()
    assert food.position[0] >= 0 and food.position[0] < WINDOW_WIDTH
    assert food.position[1] >= 0 and food.position[1] < WINDOW_HEIGHT
    # 确保食物位置对齐网格
    assert food.position[0] % GRID_SIZE == 0
    assert food.position[1] % GRID_SIZE == 0

def test_food_regenerate():
    """测试食物重新生成功能"""
    food = Food()
    old_position = food.position
    food.respawn([])  # 传入空的蛇身体列表
    # 确保新位置在有效范围内
    assert food.position[0] >= 0 and food.position[0] < WINDOW_WIDTH
    assert food.position[1] >= 0 and food.position[1] < WINDOW_HEIGHT
    # 确保新位置对齐网格
    assert food.position[0] % GRID_SIZE == 0
    assert food.position[1] % GRID_SIZE == 0 