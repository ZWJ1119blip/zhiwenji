# 第一阶段：构建前端代码
FROM node:20-alpine AS build
WORKDIR /app
# 接收外部传入的环境变量
ARG VITE_SENSENOVA_API_KEY
# 将其设置为容器内的环境变量，供 vite build 读取
ENV VITE_SENSENOVA_API_KEY=$VITE_SENSENOVA_API_KEY
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# 第二阶段：用 Nginx 运行
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
