# 后端适配说明：最近一次前端提交

本文档根据前端最近一次提交 `c82ea89 feat: add analytics and account flows` 整理，用于交接后端开发。前端项目基础请求地址当前为：

```text
https://api.shyren.xyz/moneybook/api/v1
```

本次提交主要新增了全局埋点、账号注销流程、记录创建/编辑埋点、联系人联想所依赖的数据刷新，以及若干已有接口的更明确使用方式。后端需要重点确认并适配以下接口。

## 1. 通用约定

### 鉴权

除 `POST /auth/wx-login` 外，其他业务接口都应支持 Bearer Token：

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

前端在收到 `401` 或 `403` 时，会重新调用微信登录接口刷新 token，然后重试当前请求。

### 错误响应

前端会读取响应体中的 `message` 或 `error` 字段作为错误原因。建议后端统一返回：

```json
{
  "message": "错误说明"
}
```

推荐状态码：

- `400`：参数错误
- `401`：未登录或 token 失效
- `403`：无权限
- `404`：资源不存在
- `500`：服务端错误

## 2. 微信登录接口

### `POST /auth/wx-login`

用途：小程序启动或 token 失效时登录。

请求体：

```json
{
  "code": "wx.login 返回的 code",
  "nickname": "",
  "avatar_url": ""
}
```

响应体：

```json
{
  "access_token": "JWT 或其他访问 token"
}
```

后端要求：

- 使用 `code` 换取微信 `openid`。
- 根据 `openid` 创建或查询用户。
- 签发 `access_token`。
- 前端目前不依赖 refresh token。

## 3. 记录接口

记录是当前前端的核心数据。前端字段使用小程序展示字段，后端接口字段使用 snake_case。

### 记录对象字段

后端返回记录时，建议至少包含：

```json
{
  "id": "record_id",
  "type_key": "cash",
  "value_class": "income",
  "name": "张三",
  "scene": "结婚",
  "value": "600",
  "full_date": "2026-09-02",
  "remark": "",
  "estimated_value": "",
  "cost": "",
  "images": [],
  "is_deleted": false,
  "deleted_at": ""
}
```

字段说明：

- `type_key`：记录类型，枚举值为 `cash`、`gift`、`meal`。
- `value_class`：收支方向，枚举值为 `income`、`expense`。
- `name`：联系人姓名。
- `scene`：事由，例如结婚、乔迁、生日、生娃、节日，也支持用户手输。
- `value`：核心值。礼金为金额字符串，礼物为礼物内容，请客为请客内容。
- `full_date`：日期，格式 `YYYY-MM-DD`。
- `remark`：备注，前端限制 200 字。
- `estimated_value`：礼物估值，可为空。
- `cost`：请客花费，可为空。
- `images`：图片 URL 数组。前端目前只会提交 `http/https` 图片地址，本地临时路径不会持久化提交。
- `is_deleted`：是否已进入回收站。
- `deleted_at`：删除时间，可为空。

### `GET /records`

用途：获取当前用户未删除记录。

响应体：

```json
[
  {
    "id": "1",
    "type_key": "cash",
    "value_class": "income",
    "name": "张三",
    "scene": "结婚",
    "value": "600",
    "full_date": "2026-09-02",
    "remark": "",
    "estimated_value": "",
    "cost": "",
    "images": [],
    "is_deleted": false,
    "deleted_at": ""
  }
]
```

后端要求：

- 只返回当前登录用户的数据。
- 默认不返回软删除记录。
- 建议按 `full_date` 或创建时间倒序返回，前端也会再次排序。

### `GET /records?include_deleted=true`

用途：获取当前用户全部记录，包括回收站记录。用于回收站和注销账号。

响应体同 `GET /records`，但应包含 `is_deleted: true` 的记录。

后端要求：

- 回收站页面会筛选 `is_deleted === true`。
- 注销账号流程会对返回的全部记录逐条调用永久删除接口。

### `POST /records`

用途：新建记录。

请求体：

```json
{
  "type_key": "cash",
  "value_class": "income",
  "name": "张三",
  "scene": "结婚",
  "value": "600",
  "full_date": "2026-09-02",
  "remark": "",
  "estimated_value": "",
  "cost": "",
  "images": []
}
```

响应体建议返回新建后的完整记录对象，至少包含 `id`。

后端要求：

- 校验 `type_key`、`value_class`、`name`、`scene`、`value`、`full_date`。
- `remark` 最大 200 字。
- `estimated_value` 和 `cost` 可以为空字符串。

### `PATCH /records/{id}`

用途：编辑记录。

请求体同 `POST /records`。响应体返回更新后的完整记录对象。

后端要求：

- 只能编辑当前登录用户自己的记录。
- 如果记录不存在或不属于当前用户，返回 `404` 或 `403`。
- 建议允许编辑软删除以外的正常记录即可。

### `DELETE /records/{id}`

用途：将记录移入回收站，属于软删除。

响应体建议：

```json
{
  "success": true
}
```

后端要求：

- 设置 `is_deleted = true`。
- 写入 `deleted_at`。
- 不要物理删除数据。

### `POST /records/{id}/restore`

用途：从回收站恢复记录。

响应体建议返回恢复后的完整记录对象，或：

```json
{
  "success": true
}
```

后端要求：

- 设置 `is_deleted = false`。
- 清空 `deleted_at`。

### `DELETE /records/{id}/permanent`

用途：永久删除记录。回收站永久删除和注销账号都会调用。

响应体建议：

```json
{
  "success": true
}
```

后端要求：

- 物理删除当前用户的指定记录，或做不可恢复删除。
- 幂等更好：记录已不存在时可以返回 `200`，避免注销账号批量删除被单条缺失卡住。

## 4. 反馈接口

### `POST /feedback`

用途：意见反馈页面提交用户反馈。

请求体：

```json
{
  "category": "feature",
  "content": "反馈内容"
}
```

字段说明：

- `category` 枚举值：`feature`、`issue`、`complaint`、`other`。
- `content`：反馈内容，前端限制 500 字。

响应体建议：

```json
{
  "success": true
}
```

后端要求：

- 需要鉴权，关联当前用户。
- 保存用户 ID、反馈类型、反馈内容、提交时间。

## 5. 埋点接口

本次提交新增了 `utils/analytics.js`，但前端目前还没有启用真实上报：

```js
const ANALYTICS_ENDPOINT = ''
```

后端需要新增一个统一事件接收接口，建议路径：

```text
POST /analytics/events
```

后续前端只需要把 `ANALYTICS_ENDPOINT` 改成 `'/analytics/events'`。

### `POST /analytics/events`

请求体示例：

```json
{
  "event_name": "record_create_success",
  "timestamp": 1788286400000,
  "page_path": "pages/create/edit/edit",
  "properties": {
    "user_id": "1234567",
    "device_id": "device_1788286400000_abcd1234",
    "os_type": "ios",
    "network_type": "wifi",
    "record_id": "1",
    "record_type": "cash",
    "value_class": "income",
    "record_scene": "结婚",
    "has_images": false,
    "from": "create",
    "create_duration_ms": 12000
  }
}
```

响应体建议：

```json
{
  "success": true
}
```

后端要求：

- 接口应允许高频调用，不能影响主业务流程。
- 建议异步落库或进入队列。
- 即使单个事件字段不完整，也尽量接收并保存原始 JSON。
- `user_id` 当前来自本地 profile，未必等于后端真实用户 ID。更可靠的用户身份应以后端从 token 解析出的用户为准。

### 本次前端已接入的事件名

```text
mini_program_launch_uv
mini_program_end
home_page_view
home_all_records_click
records_page_view
record_detail_view
record_delete_click
record_delete_dialog_view
record_delete_success
record_edit_click
record_edit_page_view
record_edit_save_click
record_edit_success
record_create_success
record_create_fail
record_create_type_click
record_create_form_view
stats_page_view
stats_type_switch_click
stats_year_filter_click
stats_year_filter_dialog_view
stats_year_filter_option_click
stats_records_click
stats_records_page_view
create_page_view
contacts_page_view
contacts_search
contact_detail_click
contact_detail_view
mine_page_view
profile_entry_click
mine_menu_click
data_export_click
data_export_action_click
trash_entry_click
trash_page_view
trash_manage_click
trash_restore_click
trash_delete_click
trash_restore_success
trash_delete_success
feedback_page_view
account_delete_click
account_delete_first_confirm_click
account_delete_second_confirm_click
account_delete_success
```

## 6. 注销账号流程需要后端配合

前端当前注销账号流程在 `pages/mine/settings/settings.js` 中：

1. 用户点击注销账号。
2. 前端展示第一次确认弹窗。
3. 前端展示第二次确认弹窗。
4. 前端调用 `GET /records?include_deleted=true`。
5. 前端对所有返回记录逐条调用 `DELETE /records/{id}/permanent`。
6. 前端清空本地缓存和 token。
7. 前端显示注销成功。

当前没有专门的账号注销接口。建议后端新增更完整的接口：

```text
DELETE /account
```

建议行为：

- 删除或匿名化当前用户账号。
- 永久删除该用户所有记录。
- 删除反馈或保留匿名化反馈，按隐私政策决定。
- 使当前 token 失效。
- 返回 `{ "success": true }`。

如果后端实现了 `DELETE /account`，前端后续可以简化注销流程，避免逐条删除记录。

## 7. 后端优先级建议

优先做：

1. 确认并稳定 `POST /auth/wx-login`。
2. 完整支持记录接口：列表、新建、编辑、软删除、恢复、永久删除。
3. 确保 `GET /records?include_deleted=true` 返回字段包含 `is_deleted` 和 `deleted_at`。
4. 支持 `POST /feedback`。
5. 新增 `POST /analytics/events`，再让前端打开 `ANALYTICS_ENDPOINT`。
6. 设计并实现正式 `DELETE /account`，再让前端替换当前逐条永久删除逻辑。

## 8. 前端侧注意事项

- 前端当前请求超时时间为 15 秒。
- 前端会对记录接口失败做 toast 提示，但 `fetchRecords()` 失败只会打印日志并保留本地缓存。
- 图片上传接口尚未接入；当前只有已经是 URL 的图片会提交到后端。
- 联系人没有独立后端表，联系人列表由记录中的 `name` 动态派生。
- 个人资料目前只保存在本地缓存，后端暂时没有 profile 接口。
