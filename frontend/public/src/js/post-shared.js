let currentPost = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("SharedPostContainer");

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get("token");

  if (!shareToken) {
    showError("Invalid link");
    return;
  }

  // Check if user is logged in
  const userToken = localStorage.getItem("token");
  const isLoggedIn = !!userToken;

  if (isLoggedIn) {
    try {
      const payload = JSON.parse(atob(userToken.split(".")[1]));
      currentUserId = payload.id;
    } catch (e) {
      console.error("Error parsing token:", e);
    }
  }

  try {
    const response = await fetch(`/api/posts/shared/${shareToken}`);
    const data = await response.json();

    if (data.success) {
      currentPost = data.post;
      renderPost(data.post, isLoggedIn);
      
      if (isLoggedIn) {
        await loadComments(data.post._id);
        setupCommentListeners(data.post._id);
      }
    } else {
      showError(data.message || "Content not available");
    }
  } catch (error) {
    console.error("Error loading post:", error);
    showError("Error loading content");
  }

  function renderPost(post, isLoggedIn) {
    const imageUrl = post.images && post.images.length > 0
      ? `/assets/uploads/${post.images[0]}`
      : null;

    const categoriesHtml = post.categories.map(cat =>
      `<span class="CategoryTag">${cat.title}</span>`
    ).join("");

    const isOwner = isLoggedIn && currentUserId === post.idUser;

    const commentsSection = isLoggedIn ? `
      <div class="CommentsSection">
        <div class="CommentsHeader">
          <span class="material-icons">chat_bubble</span>
          <span><span id="commentCount">${post.commentCount || 0}</span> Comments</span>
        </div>

        <div class="CommentsList" id="comments-list">
          <p style="color: #999; text-align: center; padding: 20px;">Loading comments...</p>
        </div>
        
        <div class="CommentBox">
          <textarea
            class="CommentInput"
            id="commentInput"
            placeholder="Write a comment..."
          ></textarea>
          <button class="SendCommentBtn" id="sendCommentBtn">
            <span class="material-icons">send</span>
            Send
          </button>
        </div>
      </div>
    ` : `
      <div class="GuestCTA">
        <p>Want to see comments and interact?</p>
        <a href="/src/html/index.html" class="PrimaryBtn">Join Hubbies</a>
      </div>
    `;

    const ownerActions = isOwner ? `
      <div class="OwnerActionsBar">
        <a href="/src/html/posts.html" class="ViewMyPostsBtn">
          <span class="material-icons">article</span>
          View in My Posts
        </a>
      </div>
    ` : '';

    const html = `
      <div class="SharedCard">
        <div class="PostHeader">
          <div class="PostInfo">
            <h2 class="PostTitle">${post.title}</h2>
            <span class="PostDate">Posted on ${new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="PostContent">
          <p class="PostDescription">${post.description}</p>
          ${imageUrl ? `
          <div class="PostImageContainer">
            <img src="${imageUrl}" alt="Post Image" class="PostImage">
          </div>
          ` : ''}
        </div>

        <div class="PostFooter">
          <div class="Categories">
            ${categoriesHtml}
          </div>
        </div>

        ${ownerActions}
        ${commentsSection}
      </div>
    `;

    container.innerHTML = html;
  }

  async function loadComments(postId) {
    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const data = await response.json();
      const commentsList = document.getElementById("comments-list");

      if (!commentsList) return;

      if (!data.comments || data.comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No comments yet. Be the first to comment!</p>';
        return;
      }

      const commentsHtml = data.comments.map(comment => {
        const isCommentOwner = currentUserId === comment.userId._id;
        const deleteBtn = isCommentOwner ? `
          <button class="IconButton delete-comment-btn" data-comment-id="${comment._id}" style="padding: 4px;">
            <span class="material-icons" style="font-size: 18px;">delete_outline</span>
          </button>
        ` : '';

        return `
          <div class="CommentItem" style="padding: 12px; margin-bottom: 10px; border-radius: 8px; background: var(--bg-secondary);">
            <div class="CommentHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span class="CommentAuthor" style="font-weight: 600; color: var(--text-primary);">
                  ${comment.userId.username || comment.userId.fullName || comment.userId.name}
                </span>
                <span class="CommentTime" style="color: var(--text-secondary); font-size: 0.85em; margin-left: 8px;">
                  ${new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              ${deleteBtn}
            </div>
            <div class="CommentContent" style="color: var(--text-primary);">
              ${comment.content}
            </div>
          </div>
        `;
      }).join('');

      commentsList.innerHTML = commentsHtml;

      // Setup delete listeners
      document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const commentId = e.currentTarget.dataset.commentId;
          await deleteComment(commentId, postId);
        });
      });

    } catch (error) {
      console.error("Error loading comments:", error);
      const commentsList = document.getElementById("comments-list");
      if (commentsList) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Error loading comments</p>';
      }
    }
  }

  function setupCommentListeners(postId) {
    const sendBtn = document.getElementById("sendCommentBtn");
    const commentInput = document.getElementById("commentInput");

    if (sendBtn && commentInput) {
      sendBtn.addEventListener("click", async () => {
        await sendComment(postId);
      });

      commentInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          await sendComment(postId);
        }
      });
    }
  }

  async function sendComment(postId) {
    const commentInput = document.getElementById("commentInput");
    const content = commentInput.value.trim();

    if (!content) {
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Comment cannot be empty", "error");
      } else {
        alert("Comment cannot be empty");
      }
      return;
    }

    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({
          postId: postId,
          content: content
        })
      });

      const data = await response.json();

      if (data.success) {
        commentInput.value = "";
        await loadComments(postId);
        
        // Update comment count
        const countEl = document.getElementById("commentCount");
        if (countEl) {
          countEl.textContent = parseInt(countEl.textContent) + 1;
        }

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Comment posted!',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Could not post comment", "error");
      } else {
        alert("Could not post comment");
      }
    }
  }

  async function deleteComment(commentId, postId) {
    const confirmDelete = typeof Swal !== 'undefined' 
      ? await Swal.fire({
          title: 'Delete comment?',
          text: "This action cannot be undone",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it'
        })
      : confirm('Are you sure you want to delete this comment?');

    if (typeof Swal !== 'undefined' && !confirmDelete.isConfirmed) return;
    if (typeof Swal === 'undefined' && !confirmDelete) return;

    try {
      const userToken = localStorage.getItem("token");
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        await loadComments(postId);
        
        // Update comment count
        const countEl = document.getElementById("commentCount");
        if (countEl) {
          countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
        }

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Comment deleted',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      if (typeof Swal !== 'undefined') {
        Swal.fire("Error", "Could not delete comment", "error");
      } else {
        alert("Could not delete comment");
      }
    }
  }

  function showError(message) {
    container.innerHTML = `
      <div class="ErrorContainer">
        <span class="material-icons" style="font-size: 48px; color: #ccc;">error_outline</span>
        <p class="ErrorMessage">${message}</p>
        <a href="/src/html/index.html" class="PrimaryBtn" style="margin-top: 20px; text-decoration: none;">Go to Home</a>
      </div>
    `;
  }
});
