import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.game_state import GameState
import unittest
import json
import shutil

def test_initial_state():
    """测试初始游戏状态"""
    game_state = GameState()
    assert game_state.state == GameState.MENU
    assert game_state.score == 0

def test_state_transitions():
    """测试状态转换"""
    game_state = GameState()
    
    # 测试开始游戏
    game_state.start()
    assert game_state.state == GameState.PLAYING
    assert game_state.score == 0
    
    # 测试暂停游戏
    game_state.pause()
    assert game_state.state == GameState.PAUSED
    
    # 测试继续游戏
    game_state.resume()
    assert game_state.state == GameState.PLAYING
    
    # 测试游戏结束
    game_state.game_over()
    assert game_state.state == GameState.GAME_OVER
    
    # 测试返回菜单
    game_state.show_menu()
    assert game_state.state == GameState.MENU

def test_score_system():
    """测试分数系统"""
    game_state = GameState()

    # 测试分数增加
    initial_score = game_state.score
    game_state.increase_score()
    assert game_state.score == initial_score + 1

def test_state_checks():
    """测试状态检查方法"""
    game_state = GameState()
    
    # 初始状态应该是菜单
    assert game_state.is_menu() == True
    assert game_state.is_playing() == False
    assert game_state.is_paused() == False
    assert game_state.is_game_over() == False
    
    # 开始游戏后的状态
    game_state.start()
    assert game_state.is_menu() == False
    assert game_state.is_playing() == True
    assert game_state.is_paused() == False
    assert game_state.is_game_over() == False

class TestGameState(unittest.TestCase):
    def setUp(self):
        """每个测试用例前运行"""
        self.test_data_dir = '../data_test'
        os.makedirs(self.test_data_dir, exist_ok=True)
        
        # 修改GameState类中的数据目录
        self._original_data_path = '../data/high_scores.json'
        self._test_data_path = os.path.join(self.test_data_dir, 'high_scores.json')
        
        # 创建测试用的游戏状态
        self.game_state = GameState()
        
        # 修改数据文件路径
        self.game_state.high_scores = []
        self.game_state.save_high_scores = lambda: self._save_high_scores()
        self.game_state.load_high_scores = lambda: self._load_high_scores()

    def tearDown(self):
        """每个测试用例后运行"""
        # 清理测试数据目录
        if os.path.exists(self.test_data_dir):
            shutil.rmtree(self.test_data_dir)

    def _save_high_scores(self):
        """保存最高分到测试目录"""
        os.makedirs(self.test_data_dir, exist_ok=True)
        with open(self._test_data_path, 'w') as f:
            json.dump(self.game_state.high_scores, f)

    def _load_high_scores(self):
        """从测试目录加载最高分"""
        if os.path.exists(self._test_data_path):
            with open(self._test_data_path, 'r') as f:
                return json.load(f)
        return []

    def test_initial_state(self):
        """测试初始状态"""
        self.assertEqual(self.game_state.state, GameState.MENU)
        self.assertEqual(self.game_state.score, 0)
        self.assertEqual(self.game_state.high_scores, [])

    def test_game_flow(self):
        """测试游戏状态流转"""
        # 开始游戏
        self.game_state.start()
        self.assertTrue(self.game_state.is_playing())
        
        # 暂停游戏
        self.game_state.pause()
        self.assertTrue(self.game_state.is_paused())
        
        # 继续游戏
        self.game_state.resume()
        self.assertTrue(self.game_state.is_playing())
        
        # 游戏结束
        self.game_state.game_over()
        self.assertTrue(self.game_state.is_game_over())
        
        # 返回菜单
        self.game_state.show_menu()
        self.assertTrue(self.game_state.is_menu())

    def test_score_system(self):
        """测试分数系统"""
        # 测试分数增加
        initial_score = self.game_state.score
        self.game_state.increase_score()
        self.assertEqual(self.game_state.score, initial_score + 1)
        
        # 测试多次增加分数
        for _ in range(5):
            self.game_state.increase_score()
        self.assertEqual(self.game_state.score, 6)

    def test_high_scores(self):
        """测试最高分系统"""
        # 测试保存最高分
        self.game_state.score = 100
        self.game_state.game_over()
        self.assertEqual(len(self.game_state.high_scores), 1)
        self.assertEqual(self.game_state.high_scores[0], 100)
        
        # 测试多个最高分排序
        self.game_state.start()  # 重新开始游戏
        self.game_state.score = 150
        self.game_state.game_over()
        
        self.game_state.start()  # 重新开始游戏
        self.game_state.score = 50
        self.game_state.game_over()
        
        # 验证排序和数量
        self.assertEqual(len(self.game_state.high_scores), 3)
        self.assertEqual(self.game_state.high_scores, [150, 100, 50])

    def test_high_scores_persistence(self):
        """测试最高分持久化"""
        # 保存一些分数
        scores = [100, 200, 300]
        with open(self._test_data_path, 'w') as f:
            json.dump(scores, f)
        
        # 创建新的游戏状态，验证加载
        new_game_state = GameState()
        new_game_state.load_high_scores = lambda: self._load_high_scores()
        new_game_state.high_scores = new_game_state.load_high_scores()
        self.assertEqual(new_game_state.high_scores, scores)

    def test_high_scores_limit(self):
        """测试最高分数量限制"""
        # 添加11个分数
        for i in range(11):
            self.game_state.score = i * 100
            self.game_state.game_over()
            self.game_state.start()  # 重新开始游戏
        
        # 验证只保留前10个最高分
        self.assertEqual(len(self.game_state.high_scores), 10)
        self.assertEqual(max(self.game_state.high_scores), 1000)
        self.assertEqual(min(self.game_state.high_scores), 100)

if __name__ == '__main__':
    unittest.main() 