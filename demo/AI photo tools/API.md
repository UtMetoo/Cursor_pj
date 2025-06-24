## 硅基流动平台创建图片生成请求API开发文档链接

https://docs.siliconflow.cn/cn/api-reference/images/images-generations

##APIkey

sk-lsvigtdephufbkhxlhuhcpschibwzzegcbqxzzwvydaqwvmy   //填写你创建的API密钥

##调用大模型名称：

Kwai-Kolors/Kolors

## cURL调用示例代码：

curl --request POST \
  --url https://api.siliconflow.cn/v1/images/generations \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "model": "Kwai-Kolors/Kolors",
  "prompt": "an island near sea, with seagulls, moon shining over the sea, light house, boats int he background, fish flying over the sea",
  "negative_prompt": "<string>",
  "image_size": "1024x1024",
  "batch_size": 1,
  "seed": 4999999999,
  "num_inference_steps": 20,
  "guidance_scale": 7.5,
  "image": "data:image/webp;base64, XXX"
}'

## 200的返回示例代码

{
  "images": [
    {
      "url": "<string>"
    }
  ],
  "timings": {
    "inference": 123
  },
  "seed": 123
}