import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from src.snake import Snake
from src.settings import Settings

class TestSnake(unittest.TestCase):
    def setUp(self):
        """每个测试用例前运行"""
        self.settings = Settings()
        self.snake = Snake()

    def test_initial_state(self):
        """测试蛇的初始状态"""
        # 测试初始位置
        self.assertEqual(len(self.snake.body), 1)  # 初始长度为1
        head = self.snake.body[0]
        self.assertEqual(head[0], self.settings.screen_width // 2)
        self.assertEqual(head[1], self.settings.screen_height // 2)
        
        # 测试初始方向
        self.assertEqual(self.snake.direction, 'RIGHT')

    def test_movement(self):
        """测试蛇的移动"""
        initial_x = self.snake.body[0][0]
        initial_y = self.snake.body[0][1]
    
    # 测试向右移动
        self.snake.move()
        self.assertEqual(self.snake.body[0][0], initial_x + self.settings.grid_size)
        self.assertEqual(self.snake.body[0][1], initial_y)
        
        # 测试向下移动
        self.snake.change_direction('DOWN')
        self.snake.move()
        self.assertEqual(self.snake.body[0][0], initial_x + self.settings.grid_size)
        self.assertEqual(self.snake.body[0][1], initial_y + self.settings.grid_size)

    def test_growth(self):
        """测试蛇的生长"""
        initial_length = len(self.snake.body)
        
        # 测试吃到食物后的生长
        self.snake.grow()
        self.snake.move()  # 需要移动一次才会实际增长
        self.assertEqual(len(self.snake.body), initial_length + 1)
        
        # 测试连续生长
        self.snake.grow()
        self.snake.move()
        self.snake.grow()
        self.snake.move()
        self.assertEqual(len(self.snake.body), initial_length + 3)

    def test_collision_with_self(self):
        """测试自身碰撞检测"""
        # 让蛇生长足够长
        for _ in range(4):
            self.snake.grow()
            self.snake.move()
        
        # 创造自身碰撞的情况
        self.snake.change_direction('DOWN')
        self.snake.move()
        self.snake.change_direction('LEFT')
        self.snake.move()
        self.snake.change_direction('UP')
        self.snake.move()
        
        # 验证碰撞检测
        self.assertTrue(self.snake.check_collision())

    def test_wall_collision(self):
        """测试墙壁碰撞检测"""
        # 测试右墙碰撞
        self.snake.body[0] = (self.settings.screen_width, self.settings.screen_height // 2)
        self.assertTrue(self.snake.check_collision())
        
        # 测试左墙碰撞
        self.snake.body[0] = (-self.settings.grid_size, self.settings.screen_height // 2)
        self.assertTrue(self.snake.check_collision())
        
        # 测试上墙碰撞
        self.snake.body[0] = (self.settings.screen_width // 2, -self.settings.grid_size)
        self.assertTrue(self.snake.check_collision())
        
        # 测试下墙碰撞
        self.snake.body[0] = (self.settings.screen_width // 2, self.settings.screen_height)
        self.assertTrue(self.snake.check_collision())

    def test_direction_change(self):
        """测试方向改变"""
        # 测试合法的方向改变
        self.snake.direction = 'RIGHT'
        self.snake.change_direction('UP')
        self.assertEqual(self.snake.direction, 'UP')
        
        # 测试非法的方向改变（反方向）
        self.snake.direction = 'RIGHT'
        self.snake.change_direction('LEFT')
        self.assertEqual(self.snake.direction, 'RIGHT')  # 方向不应该改变

if __name__ == '__main__':
    unittest.main() 