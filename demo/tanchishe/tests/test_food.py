import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.food import Food
from src.settings import Settings
from src.snake import Snake
import unittest

@pytest.fixture
def settings():
    return Settings()

def test_food_initial_position(settings):
    """测试食物的初始位置是否在有效范围内"""
    food = Food()
    assert food.position[0] >= 0 and food.position[0] < settings.screen_width
    assert food.position[1] >= 0 and food.position[1] < settings.screen_height
    # 确保食物位置对齐网格
    assert food.position[0] % settings.grid_size == 0
    assert food.position[1] % settings.grid_size == 0

def test_food_regenerate(settings):
    """测试食物重新生成功能"""
    food = Food()
    old_position = food.position
    food.respawn([])  # 传入空的蛇身体列表
    # 确保新位置在有效范围内
    assert food.position[0] >= 0 and food.position[0] < settings.screen_width
    assert food.position[1] >= 0 and food.position[1] < settings.screen_height
    # 确保新位置对齐网格
    assert food.position[0] % settings.grid_size == 0
    assert food.position[1] % settings.grid_size == 0

def test_food_collision_detection():
    """测试食物碰撞检测"""
    food = Food()
    # 创建一个与食物位置相同的蛇头坐标
    snake_head = food.position
    assert food.check_collision(snake_head) == True
    
    # 创建一个与食物位置不同的蛇头坐标
    snake_head = (food.position[0] + 20, food.position[1])
    assert food.check_collision(snake_head) == False

def test_food_avoid_snake():
    """测试食物生成时避开蛇身"""
    food = Food()
    # 创建一个蛇身列表
    snake_body = [(100, 100), (120, 100), (140, 100)]
    food.respawn(snake_body)
    # 确保食物不在蛇身上
    assert food.position not in snake_body 

class TestFood(unittest.TestCase):
    def setUp(self):
        """每个测试用例前运行"""
        self.settings = Settings()
        self.food = Food()
        self.snake = Snake()

    def test_initial_position(self):
        """测试食物的初始位置"""
        # 验证食物位置在屏幕范围内
        self.assertGreaterEqual(self.food.position[0], 0)
        self.assertLess(self.food.position[0], self.settings.screen_width)
        self.assertGreaterEqual(self.food.position[1], 0)
        self.assertLess(self.food.position[1], self.settings.screen_height)
        
        # 验证食物位置对齐网格
        self.assertEqual(self.food.position[0] % self.settings.grid_size, 0)
        self.assertEqual(self.food.position[1] % self.settings.grid_size, 0)

    def test_random_position(self):
        """测试食物随机位置生成"""
        initial_position = self.food.position
        
        # 生成新位置
        self.food.respawn([])
        new_position = self.food.position
        
        # 验证新位置是否不同
        self.assertNotEqual(initial_position, new_position)
        
        # 验证新位置是否在有效范围内
        self.assertGreaterEqual(new_position[0], 0)
        self.assertLess(new_position[0], self.settings.screen_width)
        self.assertGreaterEqual(new_position[1], 0)
        self.assertLess(new_position[1], self.settings.screen_height)

    def test_avoid_snake_position(self):
        """测试食物不会生成在蛇身上"""
        # 让蛇生长几次
        for _ in range(5):
            self.snake.grow()
            self.snake.move()
        
        # 多次生成食物，确保不在蛇身上
        for _ in range(10):
            self.food.respawn(self.snake.body)
            # 验证食物位置不在蛇身上
            self.assertNotIn(self.food.position, self.snake.body)

    def test_collision_detection(self):
        """测试食物与蛇的碰撞检测"""
        # 设置蛇头位置与食物重叠
        self.snake.body[0] = self.food.position
        self.assertTrue(self.food.check_collision(self.snake.body[0]))
        
        # 设置蛇头位置不与食物重叠
        self.snake.body[0] = (self.food.position[0] + self.settings.grid_size,
                            self.food.position[1])
        self.assertFalse(self.food.check_collision(self.snake.body[0]))

    def test_multiple_food_positions(self):
        """测试多次生成食物位置的分布"""
        positions = set()
        
        # 生成多个食物位置
        for _ in range(50):
            self.food.respawn([])
            positions.add(self.food.position)
        
        # 验证生成的位置数量（应该有多个不同的位置）
        self.assertGreater(len(positions), 1)
        
        # 验证所有位置都在有效范围内
        for pos in positions:
            self.assertGreaterEqual(pos[0], 0)
            self.assertLess(pos[0], self.settings.screen_width)
            self.assertGreaterEqual(pos[1], 0)
            self.assertLess(pos[1], self.settings.screen_height)
            # 验证对齐网格
            self.assertEqual(pos[0] % self.settings.grid_size, 0)
            self.assertEqual(pos[1] % self.settings.grid_size, 0)

if __name__ == '__main__':
    unittest.main() 