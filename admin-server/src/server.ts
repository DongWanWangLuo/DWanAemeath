import { Hono } from 'hono';
import { serve } from '@hNo/node-server';
import { db, migrate } from './db/index.js';
import { initAuthRoutes } from './routes/auth.js';
import { initPostRoutes } from './routes/posts.js';
import { initGalleryRoutes } from './routes/gallery.js';
import { initSettingsRoutes } from './routes/settings.js';
import { initFriendsRoutes } from './routes/friends.js';
import { initNoticeRoutes } from './routes/notice.js';
import { initDynamicRoutes } from './routes/dynamic.js';
import { initSiteLinksRoutes } from './routes/siteLinks.js';
import { authMiddleware } from './server/auth/middleware.js';

function getEnv() {
  return {
    DB: { prepare: (sql) => db.prepare(sql) },
    BUCKEP聹ձ��(����MM�%=9}MIP��ɽ���̹��عMMM%=9}MIP�������ص͕�ɕе�����������(����)�()����Ё����􁹕܁!������)������Р������Ѡ�������������ͽ��쁽����Ք�����()����Ё������􁹕܁!������)�������͔��������ѡ5�����݅ɔ�����ؤ��)�����ѡI��ѕ̡�����������ؤ�)����A���I��ѕ̡�����������ؤ�)����������I��ѕ̡�����������ؤ�)����M��ѥ���I��ѕ̡�����������ؤ�)����ɥ����I��ѕ̡�����������ؤ�)����9�ѥ��I��ѕ̡�����������ؤ�)����幅���I��ѕ̡�����������ؤ�)����M�ѕ1����I��ѕ̡�����������ؤ�()����ɽ�є������������������()����ЁA=IP�����͕%�С�ɽ���̹��عA=IP����������������)���Ʌє���)͕�ٔ�쁙�э�聅�����э��������A=IP����)���ͽ��������M��ٕȁ�չ������������輽���������蜀��A=IP��)���ͽ��������������������Ё����輽���������蜀��A=IP�������������