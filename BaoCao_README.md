# Báo cáo chi tiết — Frontend (Friend / Message / Settings / Profile / Search)

Mục tiêu
 - Mô tả các hàm, luồng và vị trí file frontend liên quan tới Friend, Message (SignalR), Settings, Profile và Search.
 - Cung cấp mapping DTO → UI, flow optimistic updates, SignalR lifecycle, và gợi ý cải tiến.

Ghi chú: số dòng tham chiếu dựa trên snapshot hiện tại trong workspace; nếu code thay đổi, số dòng sẽ khác.

---

TỔNG QUAN
- Root frontend: InteractHub/frontend
- HTTP client: `src/services/api.ts` (axios + unwrap)
- Services: `src/services/*` (friendService, messageService, userService, postService)
- Pages: `src/pages/*` (Friends.tsx, Messages.tsx, Settings.tsx, ProfilePage.tsx, SearchPage.tsx)
- Components: `src/components/*`

---

TÓM TẮT CHUNG (Cross-cutting)
- DTO normalization functions là then chốt: `normalizeMessage`, `mapFromBackend`, `mapFriendshipToRequest`.
- Chuẩn hoá optimistic pattern: snapshot -> optimistic -> API -> confirm/revert -> toast.
- Tách SignalR vào `useChatHub` hook.
- Thống nhất toast/snackbar service.

ƯU TIÊN CẢI TIẾN
1. Extract SignalR logic → `useChatHub` hook.
2. Migrate data fetching/mutations sang React Query.
3. Thêm global toast service.
4. Implement revert logic cho optimistic updates.
5. Align TypeScript DTOs với backend và thêm contract tests.

---

1) SERVICES — API & MAPPING

| File (path) | Purpose | Key functions | Start–End |
|---|---:|---|---:|
| `src/services/friendService.ts` | Friend API + DTO → UI mapping | mapFriendshipToRequest, getPendingRequests, getFriendList, sendFriendRequest, acceptRequest, rejectRequest, removeFriend, getSuggestions | 37–143 |
| `src/services/messageService.ts` | Message API + normalize | normalizeMessage, normalizeConversation, sendMessage, getConversation, getConversations, markAsRead, deleteMessage, getUnreadCount | 1–200 (approx) |
| `src/services/userService.ts` | User/profile API | getMyProfile, getProfile, updateProfile, uploadAvatar, searchUsers, updateSettings | 1–260 (approx) |
| `src/services/postService.ts` | Post API + mapping | mapFromBackend, getAllPosts, getPostById, createPost, updatePost, deletePost, searchPosts, getPostsByUser | 1–320 (approx) |

Notes: mỗi service xử lý unwrap của ApiResponse wrapper và map DTO backend sang shape frontend.

---

2) PAGES — UX flows & SignalR

| Page | Responsibility | Key functions / handlers | Start–End |
|---|---:|---|---:|
| `src/pages/Friends.tsx` | Friends list, requests, suggestions | load requests, load friends, load suggestions, handleAccept, handleDecline, handleUnfriend, handleAdd | 23–108 |
| `src/pages/Messages.tsx` | Conversations & chat UI, SignalR lifecycle | init connection, register listeners (ReceiveMessage/MessageSent), handleSend, loadConversations, loadMessages | 62–245 |
| `src/pages/Settings.tsx` | Profile & account settings | handleAvatarUpload, handleSaveProfile, handleChangePassword, handleSaveSettings | 34–161 |
| `src/pages/ProfilePage.tsx` | User profile + posts | load profile + posts, handleLike, handleAddComment, handleSave, handleShare | 17–108 |
| `src/pages/SearchPage.tsx` | Search posts & users | runSearch, handleQueryChange, debounced input | 58–114 |

Notes: pages dùng services để fetch/mutate; các thao tác tương tác (like/comment/send friend request) đa phần làm optimistic updates.

---

3) COMPONENTS — UI primitives

Short list of important components:
- `src/components/friends/RequestCards.tsx` — Request card UI (accept/decline) and local status
- `src/components/friends/FriendCard.tsx` — Friend tile with Unfriend action
- `src/components/friends/SuggestionCard.tsx` — Suggestion tile with Add button
- `src/components/messages/ConversationItem.tsx` — Sidebar conversation row (preview, unread badge)
- `src/components/messages/ChatInput.tsx` — Chat input control (Enter send / Shift+Enter newline)
- `src/components/messages/ChatBubble.tsx` — Message bubble (left/right) and time
- `src/components/settings/AvatarUpload.tsx` — Avatar preview + file input

These components are small and focused — they receive callbacks from pages and call services via pages.

---

4) DETAILED SNIPPETS & INLINE EXPLANATIONS

Phần này gom lại các đoạn mã mẫu quan trọng và đã được chú thích inline (// CHI TIẾT). Giữ ở cuối báo cáo để tiện tham khảo.

```ts
// src/services/friendService.ts — mapFriendshipToRequest
function mapFriendshipToRequest(f: FriendshipResponseDTO, currentUserId: string): FriendRequestDto {
  const other = f.requester.id !== currentUserId ? f.requester : f.receiver // CHI TIẾT: chọn bên còn lại
  return {
	id: String(other.id),                       // CHI TIẾT: normalize id -> string
	friendshipId: String(f.id),                 // CHI TIẾT: id của friendship record
	name: other.fullName ?? "",                // CHI TIẾT: tên hiển thị
	username: "",                              // CHI TIẾT: placeholder username
	avatarUrl: other.avatarUrl,                 // CHI TIẾT: avatar URL nếu có
	timeAgo: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "", // CHI TIẾT: format ngày
  }
}

// src/services/friendService.ts — getPendingRequests
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  const resp = await api.get(`/api/friendships/pending/${userId}`) // CHI TIẾT: gọi endpoint pending
  const raw = unwrap<FriendshipResponseDTO[]>(resp) ?? []         // CHI TIẾT: unwrap ApiResponse
  return raw.map((f) => mapFriendshipToRequest(f, userId))         // CHI TIẾT: map DTO -> UI model
}

// src/pages/Friends.tsx — handleAccept (optimistic)
const handleAccept = async (friendshipId: string) => {
  setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId)) // CHI TIẾT: optimistic remove from UI
  try {
	if (user?.id) await friendService.acceptRequest(friendshipId, user.id) // CHI TIẾT: call accept API
  } catch (err) {
	console.warn('accept failed', err) // CHI TIẾT: log; TODO: revert + toast
  }
}

// src/services/messageService.ts — normalizeMessage
export function normalizeMessage(raw: any) {
  return {
	id: String(raw.id ?? raw.Id ?? ''),                       // CHI TIẾT: normalize id
	messageContent: raw.messageContent ?? raw.MessageContent ?? '', // CHI TIẾT: nội dung
	senderId: String(raw.senderId ?? raw.SenderId ?? ''),     // CHI TIẾT: id người gửi
	senderName: raw.senderName ?? raw.SenderName ?? '',       // CHI TIẾT: tên người gửi
	receiverId: String(raw.receiverId ?? raw.ReceiverId ?? ''), // CHI TIẾT: id người nhận
	sentAt: raw.sentAt ?? raw.SentAt ?? new Date().toISOString(), // CHI TIẾT: timestamp
	isRead: raw.isRead ?? raw.IsRead ?? false,                // CHI TIẾT: đã đọc?
  }
}

// src/pages/Messages.tsx — SignalR init
useEffect(() => {
  const token = localStorage.getItem('token') // CHI TIẾT: lấy token JWT
  if (!token) return                            // CHI TIẾT: nếu thiếu token thì không connect
  const newConnection = new HubConnectionBuilder()
	.withUrl('/hubs/chat', { accessTokenFactory: () => token }) // CHI TIẾT: attach token
	.withAutomaticReconnect() // CHI TIẾT: reconnect tự động
	.configureLogging(LogLevel.Information) // CHI TIẾT: set log level
	.build()                                // CHI TIẾT: build instance
  setConnection(newConnection)               // CHI TIẾT: save to state
  return () => { newConnection.stop() }      // CHI TIẾT: cleanup on unmount
}, [])

// src/pages/Messages.tsx — Listeners (ReceiveMessage / MessageSent)
connection.on('ReceiveMessage', raw => {
  const normalized = normalizeMessage(raw) // CHI TIẾT: normalize payload
  const msg = toMessage(normalized, user.id) // CHI TIẾT: map to UI message
  const currentActiveId = activeIdRef.current // CHI TIẾT: get current active
  const isFromActive = String(normalized.senderId) === currentActiveId // CHI TIẾT: check sender
  const isToActive   = String(normalized.receiverId) === currentActiveId // CHI TIẾT: check receiver
  if (isFromActive || isToActive) {
	setMessages(prev => {
	  const exists = prev.some(m => m.id === msg.id) // CHI TIẾT: avoid duplicate
	  if (exists) return prev
	  return [...prev, msg] // CHI TIẾT: append
	})
  }
  loadConversations() // CHI TIẾT: refresh conv previews
})

connection.on('MessageSent', raw => {
  const msg = toMessage(normalizeMessage(raw), user.id) // CHI TIẾT: normalize + map
  setMessages(prev => {
	const exists = prev.some(m => m.id === msg.id || m.id.startsWith('opt-')) // CHI TIẾT: check optimistic
	if (exists) {
	  return prev.map(m => (m.id.startsWith('opt-') && m.text === msg.text) ? msg : m) // CHI TIẾT: replace optimistic
	}
	return [...prev, msg] // CHI TIẾT: append
  })
  loadConversations() // CHI TIẾT: refresh conv list
})

// src/pages/Messages.tsx — handleSend optimistic flow
const optimistic = { id: 'opt-'+Date.now(), text, time, isMine: true } // CHI TIẾT: create optimistic message
setMessages(prev => [...prev, optimistic]) // CHI TIẾT: append to UI
try {
  const sent = await sendMessage({ messageContent: text, receiverId: activeId }) // CHI TIẾT: call API
  setMessages(prev => prev.map(m => m.id === optimistic.id ? toMessage(sent, user.id) : m)) // CHI TIẾT: replace optimistic
  await loadConversations() // CHI TIẾT: reload conversation previews
} catch (err) {
  setMessages(prev => prev.filter(m => m.id !== optimistic.id)) // CHI TIẾT: revert on error
}

// src/services/userService.ts — uploadAvatar
async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData(); form.append('file', file) // CHI TIẾT: create formdata
  const resp = await api.post('/api/media/upload', form) // CHI TIẾT: post multipart
  const url = resp.data?.data ?? '' // CHI TIẾT: unwrap url
  return { avatarUrl: url } // CHI TIẾT: return avatarUrl
}

// src/pages/Settings.tsx — handleSaveProfile
const handleSaveProfile = async () => {
  if (!currentUser?.id) return // CHI TIẾT: validate
  setLoading(true) // CHI TIẾT: show loading
  try {
	await userService.updateProfile(currentUser.id, { fullName: profile.name, location: profile.location, bio: profile.bio, avatarUrl: profile.avatarUrl }) // CHI TIẾT: call update
	const updated = await authService.getMe() // CHI TIẾT: refresh auth user
	localStorage.setItem('user', JSON.stringify(updated)) // CHI TIẾT: cache
	window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated })) // CHI TIẾT: notify other parts
	showMsg('success', '✅ Hồ sơ đã được cập nhật!') // CHI TIẾT: feedback
  } catch (err) {
	showMsg('error', 'Cập nhật hồ sơ thất bại.') // CHI TIẾT: error feedback
  } finally { setLoading(false) } // CHI TIẾT: hide loading
}

// src/services/postService.ts — mapFromBackend
export function mapFromBackend(p: BackendPostDto): PostDto {
  const firstMedia = p.mediaItems?.[0] // CHI TIẾT: pick first media item for preview
  return {
	id:     String(p.id), // CHI TIẾT: normalize id
	author: { id: String(p.author?.id ?? p.userId), name: p.author?.fullName ?? "User", avatarUrl: p.author?.avatarUrl }, // CHI TIẾT: author mapping
	content: p.content ?? "", // CHI TIẾT: content fallback
	imageUrl: firstMedia?.url, // CHI TIẾT: image preview url
	likes: p.likeCount ?? 0, shares: p.shareCount ?? 0, commentsCount: p.commentCount ?? 0, // CHI TIẾT: counts
	createdAt: p.createdAt, // CHI TIẾT: createdAt
	isLiked: p.likeSummary?.currentUserReaction !== null && p.likeSummary?.currentUserReaction !== undefined, // CHI TIẾT: isLiked computation
	isSaved: p.isSavedByCurrentUser ?? false, // CHI TIẾT: isSaved flag
	topComments: p.topComments ?? [], likeSummary: p.likeSummary, hashTags: p.hashTags ?? [], status: p.status, // CHI TIẾT: other fields
	originalPost: p.originalPost ? mapFromBackend(p.originalPost) : undefined, // CHI TIẾT: recursive map for original post
  }
}

// src/pages/ProfilePage.tsx — load profile + posts
useEffect(() => {
  if (!user) return // CHI TIẾT: require user
  (async () => {
	setLoading(true) // CHI TIẾT: show loading spinner
	try {
	  const [prof, postResult] = await Promise.all([ userService.getMyProfile(), getPostsByUser(user.id, 0, 20) ]) // CHI TIẾT: parallel fetch
	  setProfile(prof) // CHI TIẾT: set profile
	  setPosts(postResult.data.map(toUiPost)) // CHI TIẾT: map posts to UI
	} finally { setLoading(false) } // CHI TIẾT: hide loading
  })()
}, [user])

// src/pages/SearchPage.tsx — runSearch
const runSearch = useCallback(async (q: string) => {
  if (!q.trim()) { setPosts([]); setUsers([]); setPostsTotal(0); setUsersTotal(0); return } // CHI TIẾT: clear when empty
  setLoading(true) // CHI TIẾT: show loading
  try {
	const [postResult, userResult] = await Promise.all([ searchPosts(q,0,20), userService.searchUsers(q,0,20) ]) // CHI TIẾT: parallel search
	setPosts(postResult.data.map(toUiPost)) // CHI TIẾT: map posts
	setPostsTotal(postResult.total) // CHI TIẾT: set totals
	setUsers(userResult.data) // CHI TIẾT: set users
	setUsersTotal(userResult.total) // CHI TIẾT: set totals
  } finally { setLoading(false) } // CHI TIẾT: hide loading
}, [])
```

Mục tiêu: mô tả chi tiết các hàm, luồng (workflow) và vị trí file frontend liên quan tới Friend, Message (SignalR), Settings, Profile và Search — bao gồm pages, components, services. Mỗi phần có bảng tóm tắt file, mô tả các hàm quan trọng kèm số dòng tham khảo, và các đoạn mã mẫu với vị trí chính xác.

Ghi chú: số dòng dựa trên snapshot hiện tại trong workspace. Nếu code thay đổi, số dòng có thể khác.

---

TỔNG QUAN NGẮN
- Root frontend: InteractHub/frontend
- HTTP client: `src/services/api.ts` (axios + unwrap)
- Services: `src/services/*` (`friendService`, `messageService`, `userService`, `postService`, ...)
- Pages: `src/pages/*` (`Friends.tsx`, `Messages.tsx`, `Settings.tsx`, `ProfilePage.tsx`, `SearchPage.tsx`)
- Components: `src/components/*`

---

1) FRIEND — chi tiết


| File (path) | Purpose | Key functions / lines | Start–End |
|-------------|---------|-----------------------|-----------|
| `src/services/friendService.ts` | API & DTO → UI mapping | `mapFriendshipToRequest`, `getPendingRequests`, `getFriendList`, `sendFriendRequest`, `acceptRequest`, `rejectRequest`, `removeFriend`, `getSuggestions` | 37–131 |
| `src/pages/Friends.tsx` | Friends page (requests / all / suggestions) | load requests, load friends, load suggestions, `handleAccept`, `handleDecline`, `handleUnfriend`, `handleAdd` | 23–108 |
| `src/components/friends/RequestCards.tsx` | Request card UI | component markup & local status | 13–41 |
| `src/components/friends/FriendCard.tsx` | Friend tile | component markup | 9–26 |
| `src/components/friends/SuggestionCard.tsx` | Suggestion tile | component markup & local add state | 11–31 |

Luồng & hành vi
- Khi component `Friends` mount: nếu `user.id` tồn tại → gọi `friendService.getPendingRequests(user.id)` và set state (lines 23-38).
- Khi chuyển tab `'all'` hoặc `'suggestions'` → gọi `getFriendList` / `getSuggestions` (lines 40-72).
- Accept/Decline/Add/Unfriend dùng optimistic UI: update state trước rồi gọi API; hiện chỉ log lỗi — nên thêm revert + toast.

Mã mẫu với vị trí
- `mapFriendshipToRequest` — `src/services/friendService.ts` (37-48)
```ts
function mapFriendshipToRequest(f: FriendshipResponseDTO, currentUserId: string): FriendRequestDto {
  const other = f.requester.id !== currentUserId ? f.requester : f.receiver // CHI TIẾT: chọn bên còn lại
  return {
	id: String(other.id),                       // CHI TIẾT: normalize id -> string
	friendshipId: String(f.id),                 // CHI TIẾT: id của friendship record
	name: other.fullName ?? "",                // CHI TIẾT: tên hiển thị
	username: "",                              // CHI TIẾT: placeholder username
	avatarUrl: other.avatarUrl,                 // CHI TIẾT: avatar URL nếu có
	timeAgo: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "", // CHI TIẾT: format ngày
  }
}
```

```

- `getPendingRequests` — `src/services/friendService.ts` (59-69)
```ts
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  const resp = await api.get(`/api/friendships/pending/${userId}`) // CHI TIẾT: gọi endpoint pending
  const raw = unwrap<FriendshipResponseDTO[]>(resp) ?? []         // CHI TIẾT: unwrap ApiResponse
  return raw.map((f) => mapFriendshipToRequest(f, userId))         // CHI TIẾT: map DTO -> UI model
}
```



Inline comments (// chi tiết hơn) — getPendingRequests:
```ts
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  const resp = await api.get(`/api/friendships/pending/${userId}`) // CHI TIẾT: request tới backend
  const raw = unwrap<FriendshipResponseDTO[]>(resp) ?? []         // CHI TIẾT: unwrap ApiResponse wrapper
  return raw.map((f) => mapFriendshipToRequest(f, userId))         // CHI TIẾT: map dto -> ui model
}
```

- `handleAccept` (optimistic) — `src/pages/Friends.tsx` (74-81)
```ts
const handleAccept = async (friendshipId: string) => {
  setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId)) // CHI TIẾT: optimistic remove from UI
  try {
	if (user?.id) await friendService.acceptRequest(friendshipId, user.id) // CHI TIẾT: call accept API
  } catch (err) {
	console.warn('accept failed', err) // CHI TIẾT: log; TODO: revert + toast
  }
}
```



Inline comments (// chi tiết hơn) — handleAccept:
```ts
const handleAccept = async (friendshipId: string) => {
  setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId)) // CHI TIẾT: optimistic remove from UI
  try {
	if (user?.id) await friendService.acceptRequest(friendshipId, user.id) // CHI TIẾT: call accept API
  } catch (err) {
	console.warn('accept failed', err) // CHI TIẾT: hiện chỉ log, nên revert/notify
  }
}
```

Component notes
- `RequestCards.tsx` giữ status local (accepted/declined) và gọi callbacks; nếu API fail cần rollback.
- `SuggestionCard.tsx` giữ `added` local state and calls `onAdd(id)`.

Cải tiến đề xuất
- Lưu snapshot trước khi optimistic update và revert khi API lỗi.
- Thêm toast service (thay console.warn) để thông báo người dùng.

---

2) MESSAGE (Realtime — SignalR)


| File (path) | Purpose | Key functions / lines | Start–End |
|---|---:|---:|---:|
| `src/services/messageService.ts` | API + normalize (PascalCase/camelCase) | `normalizeMessage`, `sendMessage`, `getConversation`, `getConversations` | 30–113 |
| `src/pages/Messages.tsx` | SignalR lifecycle + conversation/chat UI | init conn, listeners, `handleSend`, `loadConversations`, `loadMessages` | 62–245 |
| `src/components/messages/ConversationItem.tsx` | Sidebar item | render conversation item | 20–47 |
| `src/components/messages/ChatInput.tsx` | Input + send | local state & handlers | 9–36 |
| `src/components/messages/ChatBubble.tsx` | Message bubble | render message | 12–26 |

Flow chi tiết
- On mount: `Messages.tsx` gọi `getConversations()` → sidebar; nếu `location.state.openUserId` có thì thêm ghost entry (lines 62-99).
- Khi `activeId` thay đổi → gọi `getConversation(activeId)` để load messages (lines 105-122).
- SignalR lifecycle:
  - Khởi tạo `HubConnectionBuilder` với `accessTokenFactory` (lines 136-154).
  - Đăng ký `ReceiveMessage` và `MessageSent` (lines 167-197): normalize, append/replace messages, gọi `loadConversations()` để cập nhật preview/order.
- Gửi tin (`handleSend`): tạo optimistic message `id = 'opt-' + Date.now()`, append, gọi `sendMessage`; on success replace optimistic, on error revert (lines 217-244).

Mã mẫu với vị trí
- `normalizeMessage` — `src/services/messageService.ts` (30-43)
```ts
export function normalizeMessage(raw: any) {
  return {
	id: String(raw.id ?? raw.Id ?? ''),                       // CHI TIẾT: normalize id
	messageContent: raw.messageContent ?? raw.MessageContent ?? '', // CHI TIẾT: nội dung
	senderId: String(raw.senderId ?? raw.SenderId ?? ''),     // CHI TIẾT: id người gửi
	senderName: raw.senderName ?? raw.SenderName ?? '',       // CHI TIẾT: tên người gửi
	receiverId: String(raw.receiverId ?? raw.ReceiverId ?? ''), // CHI TIẾT: id người nhận
	sentAt: raw.sentAt ?? raw.SentAt ?? new Date().toISOString(), // CHI TIẾT: timestamp
	isRead: raw.isRead ?? raw.IsRead ?? false,                // CHI TIẾT: đã đọc?
  }
}
```

Giải thích theo dòng (line-by-line):
1. (export function) Hàm normalizeMessage nhận `raw` có thể ở cả hai dạng casing từ backend.
2. (id: ...) Lấy `id` ưu tiên `raw.id`, fallback `raw.Id`, convert sang string để đồng nhất.
3. (messageContent: ...) Trích nội dung tin từ `messageContent` hoặc `MessageContent`.
4. (senderId: ...) Lấy senderId (camel/Pascal) và convert sang string.
5. (senderName: ...) Lấy tên người gửi, fallback chuỗi rỗng nếu thiếu.
6. (senderAvatar: ...) Lấy avatar người gửi nếu có.
7. (receiverId: ...) Lấy receiverId và convert sang string.
8. (receiverName/Avatar: ...) Lấy tên/avatar người nhận nếu backend trả.
9. (sentAt: ...) Sử dụng timestamp trả về hoặc thời điểm hiện tại nếu backend không cung cấp.
10. (isRead: ...) Đặt default cho cờ đã đọc là false nếu backend không trả.

Inline comments (// chi tiết hơn) — normalizeMessage:
```ts
export function normalizeMessage(raw: any) {
  return {
	id: String(raw.id ?? raw.Id ?? ''),                       // CHI TIẾT: normalize id
	messageContent: raw.messageContent ?? raw.MessageContent ?? '', // CHI TIẾT: nội dung tin
	senderId: String(raw.senderId ?? raw.SenderId ?? ''),     // CHI TIẾT: id người gửi
	senderName: raw.senderName ?? raw.SenderName ?? '',       // CHI TIẾT: tên người gửi
	senderAvatar: raw.senderAvatar ?? raw.SenderAvatar,       // CHI TIẾT: avatar nếu có
	receiverId: String(raw.receiverId ?? raw.ReceiverId ?? ''), // CHI TIẾT: id người nhận
	receiverName: raw.receiverName ?? raw.ReceiverName ?? '', // CHI TIẾT: tên người nhận
	receiverAvatar: raw.receiverAvatar ?? raw.ReceiverAvatar, // CHI TIẾT: avatar người nhận
	sentAt: raw.sentAt ?? raw.SentAt ?? new Date().toISOString(), // CHI TIẾT: timestamp
	isRead: raw.isRead ?? raw.IsRead ?? false,                // CHI TIẾT: đã đọc?
  }
}
```

- SignalR init — `src/pages/Messages.tsx` (136-154)
```ts
useEffect(() => {
  const token = localStorage.getItem('token') // CHI TIẾT: lấy token JWT
  if (!token) return                            // CHI TIẾT: nếu thiếu token thì không connect
  const newConnection = new HubConnectionBuilder()
	.withUrl('/hubs/chat', { accessTokenFactory: () => token }) // CHI TIẾT: attach token
	.withAutomaticReconnect() // CHI TIẾT: reconnect tự động
	.configureLogging(LogLevel.Information) // CHI TIẾT: set log level
	.build()                                // CHI TIẾT: build instance
  setConnection(newConnection)               // CHI TIẾT: save to state
  return () => { newConnection.stop() }      // CHI TIẾT: cleanup on unmount
}, [])
```



Inline comments (// chi tiết hơn) — SignalR init:
```ts
useEffect(() => {
  const token = localStorage.getItem('token') // CHI TIẾT: lấy token JWT từ localStorage
  if (!token) return                            // CHI TIẾT: nếu không có token thì không connect
  const newConnection = new HubConnectionBuilder()
	.withUrl('/hubs/chat', { accessTokenFactory: () => token }) // CHI TIẾT: config url và token
	.withAutomaticReconnect() // CHI TIẾT: tự reconnect
	.configureLogging(LogLevel.Information) // CHI TIẾT: log level
	.build()                                // CHI TIẾT: build instance
  setConnection(newConnection)               // CHI TIẾT: lưu vào state để dùng ở effect khác
  return () => { newConnection.stop() }      // CHI TIẾT: cleanup
}, [])
```

- Listeners (ReceiveMessage/MessageSent) — `src/pages/Messages.tsx` (167-197)
```ts
// Khi hub phát sự kiện ReceiveMessage
connection.on('ReceiveMessage', raw => {
  const normalized = normalizeMessage(raw)              // chuẩn hoá payload
  const msg = toMessage(normalized, user.id)           // chuyển về shape UI
  const currentActiveId = activeIdRef.current

  // Kiểm tra tin nhắn thuộc conversation đang mở hay không
  const isFromActive = String(normalized.senderId) === currentActiveId
  const isToActive   = String(normalized.receiverId) === currentActiveId

  if (isFromActive || isToActive) {
	setMessages(prev => {
	  const exists = prev.some(m => m.id === msg.id)
	  if (exists) return prev // tránh duplicate
	  return [...prev, msg]
	})
  }

  // Luôn tải lại conversations để cập nhật preview và order
  loadConversations()
})

// Khi server ack tin đã gửi (MessageSent) — dùng để thay optimistic message
connection.on('MessageSent', raw => {
  const msg = toMessage(normalizeMessage(raw), user.id)
  setMessages(prev => {
	 const exists = prev.some(m => m.id === msg.id || m.id.startsWith('opt-'))
	 if (exists) {
	   // Thay optimistic message bằng message server trả về
	   return prev.map(m => (m.id.startsWith('opt-') && m.text === msg.text) ? msg : m)
	 }
	 return [...prev, msg]
  })
  loadConversations()
})
```



Inline comments (// chi tiết hơn) — Listeners (ReceiveMessage/MessageSent):
```ts
connection.on('ReceiveMessage', raw => {
  const normalized = normalizeMessage(raw) // CHI TIẾT: chuẩn hoá
  const msg = toMessage(normalized, user.id) // CHI TIẾT: chuyển về Message UI
  const currentActiveId = activeIdRef.current // CHI TIẾT: lấy activeId hiện tại
  const isFromActive = String(normalized.senderId) === currentActiveId // CHI TIẾT: từ active?
  const isToActive   = String(normalized.receiverId) === currentActiveId // CHI TIẾT: tới active?
  if (isFromActive || isToActive) {
	setMessages(prev => {
	  const exists = prev.some(m => m.id === msg.id) // CHI TIẾT: tránh duplicate
	  if (exists) return prev
	  return [...prev, msg] // CHI TIẾT: append
	})
  }
  loadConversations() // CHI TIẾT: cập nhật conversation previews
})

connection.on('MessageSent', raw => {
  const msg = toMessage(normalizeMessage(raw), user.id) // CHI TIẾT: normalize + toMessage
  setMessages(prev => {
	const exists = prev.some(m => m.id === msg.id || m.id.startsWith('opt-')) // CHI TIẾT: kiểm optimistic
	if (exists) {
	  return prev.map(m => (m.id.startsWith('opt-') && m.text === msg.text) ? msg : m) // CHI TIẾT: replace optimistic
	}
	return [...prev, msg] // CHI TIẾT: append nếu không có
  })
  loadConversations() // CHI TIẾT: refresh conv list
})
```

- `handleSend` optimistic flow — `src/pages/Messages.tsx` (217-244)
```ts
const optimistic = { id: 'opt-'+Date.now(), text, time, isMine: true }
setMessages(prev => [...prev, optimistic])
try {
  const sent = await sendMessage({ messageContent: text, receiverId: activeId })
  setMessages(prev => prev.map(m => m.id === optimistic.id ? toMessage(sent, user.id) : m))
  await loadConversations()
} catch (err) { setMessages(prev => prev.filter(m => m.id !== optimistic.id)) }
```



Inline comments (// chi tiết hơn) — handleSend:
```ts
const optimistic = { id: 'opt-'+Date.now(), text, time, isMine: true } // CHI TIẾT: id tạm để nhận diện
setMessages(prev => [...prev, optimistic]) // CHI TIẾT: append để UI hiển thị ngay
try {
  const sent = await sendMessage({ messageContent: text, receiverId: activeId }) // CHI TIẾT: call API
  setMessages(prev => prev.map(m => m.id === optimistic.id ? toMessage(sent, user.id) : m)) // CHI TIẾT: replace optimistic
  setConversations(prev => prev.map(c => c.id === activeId ? { ...c, preview: text, time: optimistic.time } : c)) // CHI TIẾT: update preview
  await loadConversations() // CHI TIẾT: reorder conversations nếu cần
} catch (err) {
  setMessages(prev => prev.filter(m => m.id !== optimistic.id)) // CHI TIẾT: revert optimistic on error
}
```

Vấn đề & đề xuất
- Tách SignalR logic vào `useChatHub` hook.
- Dùng `correlationId` để match optimistic ↔ server message.
- Thêm delivery/read receipts và retry queue khi offline.

---

3) SETTINGS — chi tiết


| File (path) | Purpose | Key functions / lines | Start–End |
|---|---|---:|---:|
| `src/pages/Settings.tsx` | Settings page (profile/account/notifications/privacy) | load profile, `handleAvatarUpload`, `handleSaveProfile`, `handleChangePassword`, `handleSaveSettings` | 34–161 |
| `src/services/userService.ts` | User/profile API | `getMyProfile`, `updateProfile`, `uploadAvatar`, `updateSettings` | 124–215 |
| `src/components/settings/AvatarUpload.tsx` | Avatar upload control | render & file input | 9–24 |

Luồng & chi tiết
- On mount: `Settings.tsx` gọi `userService.getMyProfile()` để populate profile & settings (lines 34-44).
- AvatarUpload: input file → `onUpload(file)` → `userService.uploadAvatar(file)` → update profile.avatarUrl.
- `handleSaveProfile`: gọi `userService.updateProfile`, sau đó `authService.getMe()` để refresh auth user, lưu `localStorage` và dispatch `profile-updated` (lines 86-112).

Mã mẫu
- `uploadAvatar` — `src/services/userService.ts` (201-208)
```ts
async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData(); form.append('file', file)
  const resp = await api.post('/api/media/upload', form)
  const url = resp.data?.data ?? ''
  return { avatarUrl: url }
}
```



Inline comments (// chi tiết hơn) — uploadAvatar:
```ts
async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData() // CHI TIẾT: tạo form data
  form.append('file', file)    // CHI TIẾT: add file
  const resp = await api.post('/api/media/upload', form) // CHI TIẾT: post multipart
  const url = resp.data?.data ?? '' // CHI TIẾT: lấy url từ ApiResponse
  return { avatarUrl: url } // CHI TIẾT: trả về cho caller dùng
}
```

- `handleSaveProfile` — `src/pages/Settings.tsx` (86-112)
```ts
const handleSaveProfile = async () => {
  if (!currentUser?.id) return
  setLoading(true)
  try {
	await userService.updateProfile(currentUser.id, { fullName: profile.name, location: profile.location, bio: profile.bio, avatarUrl: profile.avatarUrl })
	const updated = await authService.getMe()
	localStorage.setItem('user', JSON.stringify(updated))
	window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated }))
	showMsg('success', '✅ Hồ sơ đã được cập nhật!')
  } catch (err) { showMsg('error', 'Cập nhật hồ sơ thất bại.') } finally { setLoading(false) }
}
```

Gợi ý
- Thống nhất toast service cho toàn app.
- Hiển thị lỗi validation near-field khi server trả lỗi.

---

4) PROFILE — chi tiết


| File (path) | Purpose | Key functions / lines | Start–End |
|---|---|---:|---:|
| `src/pages/ProfilePage.tsx` | Profile page + posts render | load profile+posts, refresh on `post-created`, `handleLike`, `handleAddComment`, `handleSave`, `handleShare` | 17–108 |
| `src/services/postService.ts` | Post APIs + `mapFromBackend` | `mapFromBackend`, `getPostsByUser`, `searchPosts` | 103–267 |

Luồng & hành vi
- On mount: ProfilePage calls `userService.getMyProfile()` and `getPostsByUser(user.id)` in parallel, map posts via `toUiPost` (lines 17-38).
- Post interactions call corresponding services and update local state optimistically.

Mã mẫu
- load profile + posts — `src/pages/ProfilePage.tsx` (17-38)
```ts
useEffect(() => {
  if (!user) return
  (async () => {
	setLoading(true)
	try {
	  const [prof, postResult] = await Promise.all([ userService.getMyProfile(), getPostsByUser(user.id, 0, 20) ])
	  setProfile(prof)
	  setPosts(postResult.data.map(toUiPost))
	} finally { setLoading(false) }
  })()
}, [user])
```

- `mapFromBackend` — `src/services/postService.ts` (103-130)
  - Chuẩn hoá `BackendPostDto` → `PostDto`.

Gợi ý
- Dùng React Query cho caching/invalidation.

---

5) SEARCH — chi tiết


| File (path) | Purpose | Key functions / lines | Start–End |
|---|---|---:|---:|
| `src/pages/SearchPage.tsx` | Search UI (posts + users) | `runSearch`, `handleQueryChange`, initial mount search | 58–114 |
| `src/services/postService.ts` | `searchPosts` API | maps paginated backend → `PostDto` | 201–213 |
| `src/services/userService.ts` | `searchUsers` API | `searchUsers` | 165–179 |

Luồng & hành vi
- Người dùng nhập query → `handleQueryChange` cập nhật URL param và debounce 400ms → `runSearch(q)`.
- `runSearch` gọi song song `searchPosts` và `userService.searchUsers` in parallel and sets results + totals for tabs.

Mã mẫu
- `runSearch` — `src/pages/SearchPage.tsx` (58-86)
```ts
const runSearch = useCallback(async (q: string) => {
  if (!q.trim()) { setPosts([]); setUsers([]); setPostsTotal(0); setUsersTotal(0); return }
  setLoading(true)
  try {
	const [postResult, userResult] = await Promise.all([ searchPosts(q,0,20), userService.searchUsers(q,0,20) ])
	setPosts(postResult.data.map(toUiPost))
	setPostsTotal(postResult.total)
	setUsers(userResult.data)
	setUsersTotal(userResult.total)
  } finally { setLoading(false) }
}, [])
```

Gợi ý
- Cache per-query, support pagination/infinite-scroll; move debounce to `useDebouncedValue` hook or lodash.debounce.

---

Cross-cutting notes
- DTO normalization functions là then chốt: `normalizeMessage`, `mapFromBackend`, `mapFriendshipToRequest`.
- Chuẩn hoá optimistic pattern: snapshot -> optimistic -> API -> confirm/revert -> toast.
- Tách SignalR vào `useChatHub` hook.
- Thống nhất toast/snackbar service.

Ưu tiên cải tiến
1. Extract SignalR logic → `useChatHub` hook.
2. Migrate data fetching/mutations sang React Query.
3. Thêm global toast service.
4. Implement revert logic cho optimistic updates.
5. Align TypeScript DTOs với backend và thêm contract tests.

---

Vị trí tệp báo cáo
- Tệp này: `InteractHub/frontend/BaoCao_README.md`

Nếu bạn muốn, tôi có thể:
- 1) Bổ sung số dòng bắt đầu/kết thúc cụ thể cho từng snippet,
- 2) Tạo PR mẫu: trích SignalR ra `useChatHub` hook,
- 3) Dịch toàn bộ sang tiếng Anh.

Chọn (1)/(2)/(3) hoặc yêu cầu khác để tôi thực hiện tiếp.

<!-- One-line explanations added for each function in key source files -->

---

Phần bổ sung — Giải thích dòng‑một‑dòng cho mọi function (chính)

Dưới đây là danh sách các hàm chính trong các file nguồn đã đề cập, mỗi hàm có mô tả ngắn (1 dòng) để nhanh hiểu trách nhiệm.

- `src/services/friendService.ts`
  - mapFriendshipToRequest(f, currentUserId): Pick the other party from a friendship DTO and return UI-friendly FriendRequestDto.
  - mapUserFriendToFriend(u): Convert a UserFriendDTO to FriendDto for UI tiles.
  - getPendingRequests(userId): GET pending friendships; return mapped FriendRequestDto list.
  - getFriendList(userId): GET friend list; map to FriendDto list.
  - sendFriendRequest(requesterId, receiverId): POST a friend request to the server.
  - acceptRequest(friendshipId, userId): PUT accept endpoint for a friendship.
  - rejectRequest(friendshipId, userId): PUT reject endpoint for a friendship.
  - removeFriend(friendshipId, userId): DELETE a friendship record.
  - checkFriendshipStatus(user1, user2): GET status string between two users.
  - getSuggestions(userId): GET suggested friends and map to UI suggestions.

- `src/services/messageService.ts`
  - normalizeMessage(raw): Normalize PascalCase/camelCase backend message DTO to a consistent shape.
  - normalizeConversation(raw): Normalize a conversation DTO to UI-friendly fields.
  - sendMessage(payload): POST to send a message; unwrap response and normalize result.
  - getConversation(otherUserId): GET conversation messages by other user id and normalize each message.
  - getConversations(): GET conversations list and normalize each conversation.
  - getMessageById(messageId): GET a single message by id and normalize if present.
  - markAsRead(messageId): PUT to mark a message as read; return boolean success.
  - deleteMessage(messageId): DELETE a message; return boolean success.
  - getUnreadCount(): GET unread messages count; safe fallback to 0 on error.

- `src/services/userService.ts`
  - mapFromBackend(d): Map backend UserResponseDTO to frontend UserProfileDto with defaults.
  - getProfile(userId): GET public profile by id; return mapped UserProfileDto or mock on network errors.
  - getMyProfile(): GET authenticated user's profile and normalize / unwrap the ApiResponse wrapper.
  - searchUsers(q, skip, take): GET search users paginated; return PaginatedResponse<UserResponseDTO>.
  - updateProfile(userId, payload): PUT update profile fields and return mapped profile.
  - uploadAvatar(file): POST FormData to media upload; return avatarUrl extracted from ApiResponse.
  - updateSettings(userId, payload): PUT update user settings; throw if server returns non-success.

- `src/services/postService.ts`
  - mapFromBackend(p): Convert BackendPostDto to PostDto (media, likeSummary → isLiked, isSaved, topComments).
  - getAllPosts(skip,take): GET all posts; handle ApiResponse wrapper variations and return PaginatedResponse<PostDto>.
  - getFeed(skip,take): Alias to getAllPosts.
  - getPostById(id): GET a single post by id and map to PostDto.
  - searchPosts(q,skip,take): GET post search and map paginated backend to PostDto response.
  - createPost(payload): POST create new post and return mapped PostDto.
  - updatePost(id,payload): PUT update post and return mapped PostDto.
  - deletePost(id): DELETE a post.
  - getPostsByUser(userId,skip,take): GET posts by user; handle ApiResponse wrapper shapes.
  - getReelPosts/getTrendingPosts: GET specialized lists and map responses.

- `src/pages/Friends.tsx`
  - FriendsPage(): Page component orchestrating tabs, data load effects and handlers.
  - load effects (inline useEffect functions): call friendService and set respective states (requests/friends/suggestions).
  - handleAccept(friendshipId): Optimistically remove request then call acceptRequest.
  - handleDecline(friendshipId): Optimistically remove request then call rejectRequest.
  - handleUnfriend(friendId): Optimistically remove friend then call removeFriend.
  - handleAdd(userId): Optimistically remove suggestion then call sendFriendRequest.

- `src/pages/Messages.tsx`
  - toConversation(dto): Convert ConversationDTO to UI Conversation shape.
  - toMessage(dto, currentUserId): Convert MessageResponseDTO to UI Message shape.
  - MessagesPage(): Page component handling conversations, messages, SignalR connection and send flow.
  - loadConversations (useCallback): Fetch conversations and manage ghost entries / active selection.
  - loadMessages(otherUserId): Fetch messages for active conversation and set messages state.
  - SignalR init effect: Build HubConnection and set to state.
  - SignalR listeners effect: Start connection and register ReceiveMessage/MessageSent handlers.
  - handleSend(text): Create optimistic message, call sendMessage API, replace or revert based on result.

- `src/pages/Settings.tsx`
  - SettingsPage(): Page component with tabs and handlers for profile, account, notifications, privacy.
  - showMsg(type,text): Local helper to show transient message banners.
  - handleAvatarUpload(file): Upload file via userService.uploadAvatar and update profile.avatarUrl.
  - handleSaveProfile(): Validate & call updateProfile, refresh auth user, dispatch profile-updated event.
  - handleChangePassword(): Validate passwords and call authService.changePassword.
  - handleSaveSettings(): Call userService.updateSettings with toggles/selections.

- `src/pages/ProfilePage.tsx`
  - toUiPost(p): Convert PostDto to UI Post shape including top comments mapping.
  - ProfilePage(): Page component that loads profile + posts and wires post interactions.
  - handleLike(postId): Toggle like via likeService and update local state optimistically.
  - handleAddComment(postId, content): Add comment via commentService and increment local counter.
  - handleLoadComments(postId): Return comments for a post using commentService.
  - handleSave(postId): Toggle saved state via savedPostService and update local state.
  - handleShare(postId): Share via shareService and increment shares count locally.

- `src/pages/SearchPage.tsx`
  - toUiPost(p): Convert PostDto to UiPost used in search results.
  - UserResultCard: Component to render a user search result clickable to profile.
  - SearchPage(): Page component handling debounced search input, tabs and results.
  - runSearch(q): Call postService.searchPosts and userService.searchUsers in parallel and set results.
  - handleQueryChange(e): Debounce input changes and call runSearch after 400ms.

- Components (short)
  - `src/components/friends/RequestCards.tsx` — RequestCard(): UI card for a friend request with Accept/Decline and local status.
  - `src/components/friends/FriendCard.tsx` — FriendCard(): Render friend tile with Unfriend action.
  - `src/components/friends/SuggestionCard.tsx` — SuggestionCard(): Render suggestion with Add button and local added state.
  - `src/components/messages/ConversationItem.tsx` — ConversationItem(): Sidebar row rendering conversation preview and unread badge.
  - `src/components/messages/ChatInput.tsx` — ChatInput(): Input control with Enter/Send handling and disabled state.
  - `src/components/messages/ChatBubble.tsx` — ChatBubble(): Render a message bubble (left/right) and time label.
	- `src/components/settings/AvatarUpload.tsx` — AvatarUpload(): Avatar preview and file input that calls onUpload(file).

---

Ghi chú: nếu bạn muốn, tôi có thể tự động chèn những comment dòng-một vào mã nguồn (thêm comment trên các hàm trong file .ts/.tsx). Muốn tôi thực hiện việc đó (tạo patch thay đổi source) hay chỉ giữ phần mô tả trong báo cáo này?

---

Tổng hợp: giải thích dòng‑một‑dòng (//) cho mọi đoạn code mẫu

Dưới đây là bản tóm tắt các giải thích ngắn (mỗi dòng bắt đầu bằng //) cho tất cả các đoạn code mẫu đã xuất hiện trong báo cáo. Bạn có thể copy/paste các dòng này vào README hoặc trực tiếp vào code nếu muốn.

// src/services/friendService.ts — mapFriendshipToRequest: chọn "other" user trong friendship và trả về FriendRequestDto dùng cho UI

// src/services/friendService.ts — mapUserFriendToFriend: chuyển UserFriendDTO sang FriendDto cho hiển thị
// src/services/friendService.ts — getPendingRequests: GET pending requests, unwrap response, map sang UI
// src/services/friendService.ts — getFriendList: GET friend list và map sang FriendDto
// src/services/friendService.ts — sendFriendRequest: POST tạo friend request (requester -> receiver)
// src/services/friendService.ts — acceptRequest: PUT accept endpoint cho friendship
// src/services/friendService.ts — rejectRequest: PUT reject endpoint cho friendship
// src/services/friendService.ts — removeFriend: DELETE friendship record
// src/services/friendService.ts — checkFriendshipStatus: GET trạng thái giữa hai user
// src/services/friendService.ts — getSuggestions: GET suggested friends và map cho UI

// src/services/messageService.ts — normalizeMessage: chuẩn hoá raw message (Pascal/camel) về shape cố định
// src/services/messageService.ts — normalizeConversation: chuẩn hoá conversation preview cho sidebar
// src/services/messageService.ts — sendMessage: POST gửi message và trả về message đã normalize
// src/services/messageService.ts — getConversation: GET messages giữa current user và otherUserId, trả về array normalized
// src/services/messageService.ts — getConversations: GET conversation previews và normalize
// src/services/messageService.ts — getMessageById: GET chi tiết message theo id và normalize
// src/services/messageService.ts — markAsRead: PUT mark-as-read, trả về boolean success
// src/services/messageService.ts — deleteMessage: DELETE message theo id, trả về boolean
// src/services/messageService.ts — getUnreadCount: GET số message chưa đọc, fallback 0 nếu lỗi

// src/services/userService.ts — getMyProfile: GET profile của user hiện tại và normalize fields
// src/services/userService.ts — getProfile: GET public profile của user theo id và map
// src/services/userService.ts — updateProfile: PUT cập nhật profile với payload map sang backend naming
// src/services/userService.ts — uploadAvatar: POST multipart/form-data upload ảnh, trả về avatarUrl
// src/services/userService.ts — searchUsers: GET tìm user theo query, trả về paginated response
// src/services/userService.ts — updateSettings: PUT cập nhật user settings

// src/services/postService.ts — mapFromBackend: map BackendPostDto → PostDto, tính isLiked/isSaved/topComments
// src/services/postService.ts — getAllPosts/getFeed: GET posts, xử lý ApiResponse wrapper và map paginated
// src/services/postService.ts — getPostById: GET post theo id và map
// src/services/postService.ts — searchPosts: GET search posts và map paginated → PostDto
// src/services/postService.ts — createPost/updatePost/deletePost: CRUD post endpoints, map responses
// src/services/postService.ts — getPostsByUser/getReelPosts/getTrendingPosts: các endpoint chuyên biệt trả paginated

// src/pages/Friends.tsx — FriendsPage: quản lý tabs (requests/all/suggestions) và các handler accept/decline/add/unfriend
// src/pages/Friends.tsx — load effects: useEffect load pending/friends/suggestions khi mount hoặc user thay đổi
// src/pages/Friends.tsx — handleAccept/handleDecline/handleUnfriend/handleAdd: thao tác optimistic rồi gọi API

// src/pages/Messages.tsx — MessagesPage: quản lý sidebar conversations, active conversation, SignalR lifecycle
// src/pages/Messages.tsx — SignalR init: build HubConnection với accessTokenFactory lấy token từ localStorage
// src/pages/Messages.tsx — Listeners ReceiveMessage/MessageSent: normalize payload, append/replace messages, reload conversations
// src/pages/Messages.tsx — handleSend: tạo optimistic message, gọi API send, replace hoặc revert

// src/pages/Settings.tsx — SettingsPage: load profile, handleAvatarUpload, handleSaveProfile, handleChangePassword, handleSaveSettings
// src/pages/Settings.tsx — handleAvatarUpload: upload file -> userService.uploadAvatar -> update profile.avatarUrl
// src/pages/Settings.tsx — handleSaveProfile: validate, updateProfile, refresh auth user, dispatch profile-updated

// src/pages/ProfilePage.tsx — ProfilePage: load profile + posts in parallel, map posts to UI, handlers like/comment/save/share (optimistic)
// src/pages/ProfilePage.tsx — handleLike: optimistic toggle like and call likeService
// src/pages/ProfilePage.tsx — handleAddComment: call commentService.addComment and update local post comments

// src/pages/SearchPage.tsx — SearchPage: debounced query handling, runSearch calls posts+users parallel, set results & totals
// src/pages/SearchPage.tsx — runSearch: clear on empty, set loading, Promise.all(searchPosts, searchUsers), map results

// Components — RequestCards / FriendCard / SuggestionCard / ConversationItem / ChatInput / ChatBubble / AvatarUpload
// RequestCards: hiển thị request card, giữ local status accepted/declined, gọi onAccept/onDecline
// FriendCard: hiển thị friend tile với unfriend action
// SuggestionCard: hiển thị suggestion và disable Add button sau khi nhấn
// ConversationItem: render sidebar row với avatar/name/preview/unread badge
// ChatInput: input control xử lý Enter/Shift+Enter và gửi message
// ChatBubble: render message bubble, đổi vị trí theo isMine, show time
// AvatarUpload: preview avatar và input file, validate type/size, call onUpload

// Nếu bạn muốn, tôi có thể mở rộng mỗi dòng // thành một comment ngắn trong từng file nguồn (thêm vào trên mỗi hàm) — trả lời "apply to source" để tôi tạo patch áp comment trực tiếp vào các file .ts/.tsx.

---

Mọi đoạn code (tất cả ```ts``` snippets) — giải thích dòng‑một‑dòng (tổng hợp chi tiết)

Phần dưới đây gom tất cả các đoạn mã mẫu xuất hiện trong báo cáo và cho mỗi dòng trong snippet một comment ngắn (//) giải thích ngay sau câu mã. Đây là bản sao để bạn chèn vào README; nếu muốn tôi có thể áp trực tiếp vào mã nguồn.

```ts
// src/services/friendService.ts — mapFriendshipToRequest
function mapFriendshipToRequest(f: FriendshipResponseDTO, currentUserId: string): FriendRequestDto {
  const other = f.requester.id !== currentUserId ? f.requester : f.receiver // CHI TIẾT: chọn bên còn lại
  return {
	id: String(other.id),                       // CHI TIẾT: normalize id -> string
	friendshipId: String(f.id),                 // CHI TIẾT: id của friendship record
	name: other.fullName ?? "",                // CHI TIẾT: tên hiển thị
	username: "",                              // CHI TIẾT: placeholder username
	avatarUrl: other.avatarUrl,                 // CHI TIẾT: avatar URL nếu có
	timeAgo: f.createdAt ? new Date(f.createdAt).toLocaleDateString("vi-VN") : "", // CHI TIẾT: format ngày
  }
}

// src/services/friendService.ts — getPendingRequests
async function getPendingRequests(userId: string): Promise<FriendRequestDto[]> {
  const resp = await api.get(`/api/friendships/pending/${userId}`) // CHI TIẾT: gọi endpoint pending
  const raw = unwrap<FriendshipResponseDTO[]>(resp) ?? []         // CHI TIẾT: unwrap ApiResponse
  return raw.map((f) => mapFriendshipToRequest(f, userId))         // CHI TIẾT: map DTO -> UI model
}

// src/pages/Friends.tsx — handleAccept (optimistic)
const handleAccept = async (friendshipId: string) => {
  setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId)) // CHI TIẾT: optimistic remove from UI
  try {
	if (user?.id) await friendService.acceptRequest(friendshipId, user.id) // CHI TIẾT: call accept API
  } catch (err) {
	console.warn('accept failed', err) // CHI TIẾT: log; TODO: revert + toast
  }
}

// src/services/messageService.ts — normalizeMessage
export function normalizeMessage(raw: any) {
  return {
	id: String(raw.id ?? raw.Id ?? ''),                       // CHI TIẾT: normalize id
	messageContent: raw.messageContent ?? raw.MessageContent ?? '', // CHI TIẾT: nội dung
	senderId: String(raw.senderId ?? raw.SenderId ?? ''),     // CHI TIẾT: id người gửi
	senderName: raw.senderName ?? raw.SenderName ?? '',       // CHI TIẾT: tên người gửi
	receiverId: String(raw.receiverId ?? raw.ReceiverId ?? ''), // CHI TIẾT: id người nhận
	sentAt: raw.sentAt ?? raw.SentAt ?? new Date().toISOString(), // CHI TIẾT: timestamp
	isRead: raw.isRead ?? raw.IsRead ?? false,                // CHI TIẾT: đã đọc?
  }
}

// src/pages/Messages.tsx — SignalR init
useEffect(() => {
  const token = localStorage.getItem('token') // CHI TIẾT: lấy token JWT
  if (!token) return                            // CHI TIẾT: nếu thiếu token thì không connect
  const newConnection = new HubConnectionBuilder()
	.withUrl('/hubs/chat', { accessTokenFactory: () => token }) // CHI TIẾT: attach token
	.withAutomaticReconnect() // CHI TIẾT: reconnect tự động
	.configureLogging(LogLevel.Information) // CHI TIẾT: set log level
	.build()                                // CHI TIẾT: build instance
  setConnection(newConnection)               // CHI TIẾT: save to state
  return () => { newConnection.stop() }      // CHI TIẾT: cleanup on unmount
}, [])

// src/pages/Messages.tsx — Listeners (ReceiveMessage / MessageSent)
connection.on('ReceiveMessage', raw => {
  const normalized = normalizeMessage(raw) // CHI TIẾT: normalize payload
  const msg = toMessage(normalized, user.id) // CHI TIẾT: map to UI message
  const currentActiveId = activeIdRef.current // CHI TIẾT: get current active
  const isFromActive = String(normalized.senderId) === currentActiveId // CHI TIẾT: check sender
  const isToActive   = String(normalized.receiverId) === currentActiveId // CHI TIẾT: check receiver
  if (isFromActive || isToActive) {
	setMessages(prev => {
	  const exists = prev.some(m => m.id === msg.id) // CHI TIẾT: avoid duplicate
	  if (exists) return prev
	  return [...prev, msg] // CHI TIẾT: append
	})
  }
  loadConversations() // CHI TIẾT: refresh conv previews
})

connection.on('MessageSent', raw => {
  const msg = toMessage(normalizeMessage(raw), user.id) // CHI TIẾT: normalize + map
  setMessages(prev => {
	const exists = prev.some(m => m.id === msg.id || m.id.startsWith('opt-')) // CHI TIẾT: check optimistic
	if (exists) {
	  return prev.map(m => (m.id.startsWith('opt-') && m.text === msg.text) ? msg : m) // CHI TIẾT: replace optimistic
	}
	return [...prev, msg] // CHI TIẾT: append
  })
  loadConversations() // CHI TIẾT: refresh conv list
})

// src/pages/Messages.tsx — handleSend optimistic flow
const optimistic = { id: 'opt-'+Date.now(), text, time, isMine: true } // CHI TIẾT: create optimistic message
setMessages(prev => [...prev, optimistic]) // CHI TIẾT: append to UI
try {
  const sent = await sendMessage({ messageContent: text, receiverId: activeId }) // CHI TIẾT: call API
  setMessages(prev => prev.map(m => m.id === optimistic.id ? toMessage(sent, user.id) : m)) // CHI TIẾT: replace optimistic
  await loadConversations() // CHI TIẾT: reload conversation previews
} catch (err) {
  setMessages(prev => prev.filter(m => m.id !== optimistic.id)) // CHI TIẾT: revert on error
}

// src/services/userService.ts — uploadAvatar
async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData(); form.append('file', file) // CHI TIẾT: create formdata
  const resp = await api.post('/api/media/upload', form) // CHI TIẾT: post multipart
  const url = resp.data?.data ?? '' // CHI TIẾT: unwrap url
  return { avatarUrl: url } // CHI TIẾT: return avatarUrl
}

// src/pages/Settings.tsx — handleSaveProfile
const handleSaveProfile = async () => {
  if (!currentUser?.id) return // CHI TIẾT: validate
  setLoading(true) // CHI TIẾT: show loading
  try {
	await userService.updateProfile(currentUser.id, { fullName: profile.name, location: profile.location, bio: profile.bio, avatarUrl: profile.avatarUrl }) // CHI TIẾT: call update
	const updated = await authService.getMe() // CHI TIẾT: refresh auth user
	localStorage.setItem('user', JSON.stringify(updated)) // CHI TIẾT: cache
	window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated })) // CHI TIẾT: notify other parts
	showMsg('success', '✅ Hồ sơ đã được cập nhật!') // CHI TIẾT: feedback
  } catch (err) {
	showMsg('error', 'Cập nhật hồ sơ thất bại.') // CHI TIẾT: error feedback
  } finally { setLoading(false) } // CHI TIẾT: hide loading
}

// src/services/postService.ts — mapFromBackend
export function mapFromBackend(p: BackendPostDto): PostDto {
  const firstMedia = p.mediaItems?.[0] // CHI TIẾT: pick first media item for preview
  return {
	id:     String(p.id), // CHI TIẾT: normalize id
	author: { id: String(p.author?.id ?? p.userId), name: p.author?.fullName ?? "User", avatarUrl: p.author?.avatarUrl }, // CHI TIẾT: author mapping
	content: p.content ?? "", // CHI TIẾT: content fallback
	imageUrl: firstMedia?.url, // CHI TIẾT: image preview url
	likes: p.likeCount ?? 0, shares: p.shareCount ?? 0, commentsCount: p.commentCount ?? 0, // CHI TIẾT: counts
	createdAt: p.createdAt, // CHI TIẾT: createdAt
	isLiked: p.likeSummary?.currentUserReaction !== null && p.likeSummary?.currentUserReaction !== undefined, // CHI TIẾT: isLiked computation
	isSaved: p.isSavedByCurrentUser ?? false, // CHI TIẾT: isSaved flag
	topComments: p.topComments ?? [], likeSummary: p.likeSummary, hashTags: p.hashTags ?? [], status: p.status, // CHI TIẾT: other fields
	originalPost: p.originalPost ? mapFromBackend(p.originalPost) : undefined, // CHI TIẾT: recursive map for original post
  }
}

// src/pages/ProfilePage.tsx — load profile + posts
useEffect(() => {
  if (!user) return // CHI TIẾT: require user
  (async () => {
	setLoading(true) // CHI TIẾT: show loading spinner
	try {
	  const [prof, postResult] = await Promise.all([ userService.getMyProfile(), getPostsByUser(user.id, 0, 20) ]) // CHI TIẾT: parallel fetch
	  setProfile(prof) // CHI TIẾT: set profile
	  setPosts(postResult.data.map(toUiPost)) // CHI TIẾT: map posts to UI
	} finally { setLoading(false) } // CHI TIẾT: hide loading
  })()
}, [user])

// src/pages/SearchPage.tsx — runSearch
const runSearch = useCallback(async (q: string) => {
  if (!q.trim()) { setPosts([]); setUsers([]); setPostsTotal(0); setUsersTotal(0); return } // CHI TIẾT: clear when empty
  setLoading(true) // CHI TIẾT: show loading
  try {
	const [postResult, userResult] = await Promise.all([ searchPosts(q,0,20), userService.searchUsers(q,0,20) ]) // CHI TIẾT: parallel search
	setPosts(postResult.data.map(toUiPost)) // CHI TIẾT: map posts
	setPostsTotal(postResult.total) // CHI TIẾT: set totals
	setUsers(userResult.data) // CHI TIẾT: set users
	setUsersTotal(userResult.total) // CHI TIẾT: set totals
  } finally { setLoading(false) } // CHI TIẾT: hide loading
}, [])
```
