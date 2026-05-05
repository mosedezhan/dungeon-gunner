import { Chaser } from '../entities/enemies/Chaser.js';
import { Rusher } from '../entities/enemies/Rusher.js';
import { Shooter } from '../entities/enemies/Shooter.js';
import { Giant } from '../entities/enemies/Giant.js';
import { Bomber } from '../entities/enemies/Bomber.js';
import { Mimic } from '../entities/enemies/Mimic.js';
import { EliteChaser } from '../entities/enemies/EliteChaser.js';
import { EliteShooter } from '../entities/enemies/EliteShooter.js';
import { EliteGiant } from '../entities/enemies/EliteGiant.js';

export const DEBUG_SPAWNABLE = {
  '1: 追击者': Chaser,
  '2: 冲锋者': Rusher,
  '3: 射手': Shooter,
  '4: 巨人': Giant,
  '5: 自爆者': Bomber,
  '6: 宝箱怪': Mimic,
  '7: 精英追击者': EliteChaser,
  '8: 精英射手': EliteShooter,
  '9: 精英巨人': EliteGiant,
};
