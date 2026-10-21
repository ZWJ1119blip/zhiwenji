# ============================================================
# 《织纹集》多阶段构建 Dockerfile
# 阶段一：node:20-alpine 构建产物（dist）
# 阶段二：nginx:alpine 静态托管（含 SPA 路由回退）
# ============================================================

# ---------- 阶段一：构建 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 先只复制依赖清单，利用 Docker 层缓存：依赖不变则跳过 npm install
COPY package.json package-lock.json ./
RUN npm install

# 复制全部源码并构建
COPY . .
RUN npm run build

# ---------- 阶段二：运行 ----------
FROM nginx:alpine

# 把构建产物复制到 Nginx 静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 自定义 Nginx 配置（含 React Router try_files 回退）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
