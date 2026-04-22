document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Hero Mouse Parallax Effect
    const hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        hero.style.setProperty('--mouse-x', (x - 0.5) * 30 + 'px');
        hero.style.setProperty('--mouse-y', (y - 0.5) * 30 + 'px');
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Free Board Logic (LocalStorage) ---
    const boardForm = document.getElementById('boardForm');
    const boardList = document.getElementById('boardList');
    const adminBtn = document.getElementById('adminBtn');
    
    let isAdmin = sessionStorage.getItem('isAdmin') === 'true';

    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAdmin) {
                isAdmin = false;
                sessionStorage.setItem('isAdmin', 'false');
                alert('관리자 모드가 해제되었습니다.');
                location.reload();
            } else {
                isAdmin = true;
                sessionStorage.setItem('isAdmin', 'true');
                alert('관리자 모드로 접속했습니다.');
                location.reload();
            }
        });
    }

    if (boardForm && boardList) {
        let posts = JSON.parse(localStorage.getItem('freeBoardPosts')) || [];
        let currentEditIndex = -1;
        const boardSubmitBtn = document.getElementById('boardSubmitBtn');

        const showFormBtn = document.getElementById('showFormBtn');
        const boardCancelBtn = document.getElementById('boardCancelBtn');

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                currentEditIndex = -1;
                boardForm.reset();
                if (boardSubmitBtn) boardSubmitBtn.innerText = "게시글 등록하기";
                const pwField = document.getElementById('boardSecretPw');
                if(pwField) pwField.style.display = 'none';

                boardForm.style.display = 'block';
                showFormBtn.style.display = 'none';
                boardForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        if (boardCancelBtn) {
            boardCancelBtn.addEventListener('click', () => {
                boardForm.style.display = 'none';
                if (showFormBtn) showFormBtn.style.display = 'inline-block';
                currentEditIndex = -1;
            });
        }

        const boardSecret = document.getElementById('boardSecret');
        const boardSecretPw = document.getElementById('boardSecretPw');
        if (boardSecret) {
            boardSecret.addEventListener('change', () => {
                if (boardSecretPw) {
                    boardSecretPw.style.display = boardSecret.checked ? 'block' : 'none';
                }
            });
        }

        window.togglePostContent = (index) => {
            const wrapper = document.getElementById(`postBodyWrapper-${index}`);
            if(wrapper) {
                if (wrapper.style.display === 'none') {
                    wrapper.style.display = 'block';
                    if (posts[index].views === undefined) posts[index].views = 0;
                    posts[index].views++;
                    savePosts();
                    const viewsEl = document.getElementById(`postViews-${index}`);
                    if(viewsEl) viewsEl.innerText = posts[index].views;
                } else {
                    wrapper.style.display = 'none';
                }
            }
        };

        window.unlockSecretPost = (index) => {
            let pw = prompt('비밀번호를 입력하세요:');
            if (pw === posts[index].secretPw) {
                const titleSpan = document.getElementById(`postTitle-${index}`);
                if(titleSpan) {
                    titleSpan.innerHTML = posts[index].title || "제목 없음";
                }
                const titleLock = document.getElementById(`postLockIcon-${index}`);
                if(titleLock) titleLock.style.display = 'none';

                document.getElementById(`lockNotice-${index}`).style.display = 'none';
                document.getElementById(`postBody-${index}`).style.display = 'block';
            } else if (pw !== null) {
                alert('비밀번호가 일치하지 않습니다.');
            }
        };

        const savePosts = () => {
            localStorage.setItem('freeBoardPosts', JSON.stringify(posts));
        };

        window.likePost = (pIndex) => {
            if (!posts[pIndex].likes) posts[pIndex].likes = 0;
            posts[pIndex].likes++;
            savePosts();
            renderPosts();
        };

        window.deletePost = (pIndex) => {
            if (!isAdmin) return alert('관리자 권한이 필요합니다.');
            if (confirm('이 게시글을 삭제하시겠습니까?')) {
                posts.splice(pIndex, 1);
                savePosts();
                renderPosts();
            }
        };

        window.editPost = (pIndex) => {
            if (!isAdmin) return alert('관리자 권한이 필요합니다.');
            
            currentEditIndex = pIndex;
            const post = posts[pIndex];

            document.getElementById('boardName').value = post.author || "";
            document.getElementById('boardEmail').value = post.email || "";
            document.getElementById('boardTitle').value = post.title || "";
            document.getElementById('boardMessage').value = post.content || "";
            
            const boardSecret = document.getElementById('boardSecret');
            const boardSecretPw = document.getElementById('boardSecretPw');
            if (boardSecret) {
                boardSecret.checked = post.isSecret || false;
                if (boardSecretPw) {
                    boardSecretPw.value = post.secretPw || "";
                    boardSecretPw.style.display = boardSecret.checked ? 'block' : 'none';
                }
            }

            if (boardSubmitBtn) boardSubmitBtn.innerText = "게시글 수정 완료";
            boardForm.style.display = 'block';
            if (showFormBtn) showFormBtn.style.display = 'none';
            boardForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        window.deleteReply = (pIndex, rIndex) => {
            if (!isAdmin) return alert('관리자 권한이 필요합니다.');
            if (confirm('이 답글을 삭제하시겠습니까?')) {
                posts[pIndex].replies.splice(rIndex, 1);
                savePosts();
                renderPosts();
            }
        };

        const renderPosts = () => {
             boardList.innerHTML = '';
             if (posts.length === 0) {
                 boardList.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px; padding:30px;">등록된 게시글이 없습니다. 첫 번째 글을 남겨주세요!</p>';
                 return;
             }

             posts.forEach((post, postIndex) => {
                 const postEl = document.createElement('div');
                 postEl.className = 'board-list-item';
                 
                 let repliesHtml = '';
                 if (post.replies && post.replies.length > 0) {
                     repliesHtml = `<div class="replies-container">` + 
                         post.replies.map((r, rIndex) => `
                             <div class="reply-item">
                                 <div style="display:flex; justify-content:space-between; align-items:center;">
                                     <div><strong>${r.author}</strong> <span style="color:#aaa; font-size:0.8rem; margin-left:10px;">${r.date}</span></div>
                                     ${isAdmin ? `<button type="button" style="color:red; background:none; border:none; cursor:pointer; font-size:0.8rem; text-decoration:underline;" onclick="deleteReply(${postIndex}, ${rIndex})">삭제</button>` : ''}
                                 </div>
                                 <p style="margin-top:8px; white-space:pre-wrap;">${r.content}</p>
                             </div>
                         `).join('') + `</div>`;
                 }

                 let adminPostControls = isAdmin ? `
                     <div>
                         <button type="button" style="color:#0056D2; background:none; border:none; cursor:pointer; font-size:0.85rem; text-decoration:underline; margin-right:10px;" onclick="editPost(${postIndex})">수정</button>
                         <button type="button" style="color:red; background:none; border:none; cursor:pointer; font-size:0.85rem; text-decoration:underline;" onclick="deletePost(${postIndex})">게시글 삭제</button>
                     </div>
                 ` : '';

                 const isLocked = post.isSecret && !isAdmin;
                 const titleText = isLocked ? '비밀글입니다.' : (post.title || "제목 없음");
                 const dateOnly = post.date.includes('오') ? post.date.split('오')[0].trim() : post.date.split(' ')[0];
                 const postNum = posts.length - postIndex;
                 const viewsCount = post.views || 0;
                 const likesCount = post.likes || 0;
                 
                 postEl.innerHTML = `
                      <div class="list-item-header" onclick="togglePostContent(${postIndex})">
                          <div style="width: 60px; text-align: center; color: #888; font-size: 0.95rem;">${postNum}</div>
                          <div style="flex: 1; min-width: 0; display:flex; align-items:center; gap:8px; padding-left: 15px;">
                              <span id="postLockIcon-${postIndex}" style="font-size:0.9rem; color:#888; ${isLocked ? '' : 'display:none;'}">🔒</span>
                              <span id="postTitle-${postIndex}" style="font-weight: 500; font-size: 1rem; color: #111; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${titleText}</span>
                          </div>
                          <div style="width: 100px; flex-shrink: 0; text-align: center; color: #555; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${post.author}</div>
                          <div style="width: 100px; flex-shrink: 0; text-align: center; color: #888; font-size: 0.95rem;">${dateOnly}</div>
                          <div id="postViews-${postIndex}" style="width: 70px; flex-shrink: 0; text-align: center; color: #888; font-size: 0.95rem;">${viewsCount}</div>
                          <div id="postLikes-${postIndex}" style="width: 70px; flex-shrink: 0; text-align: center; color: #888; font-size: 0.95rem;">${likesCount}</div>
                      </div>
                      
                      <div id="postBodyWrapper-${postIndex}" style="display: none; padding: 25px; background: #fdfdfd; border-bottom: 2px solid #eaeaea;">
                          <div id="lockNotice-${postIndex}" style="${isLocked ? 'display: flex;' : 'display: none;'} flex-direction:column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; padding: 40px 0; background: #f0f0f0; border-radius: 6px;" onclick="unlockSecretPost(${postIndex})">
                              <span style="font-size:2rem;">🔒</span> 
                              <span style="color:#555; font-size:0.95rem;">비밀글입니다. (클릭하여 비밀번호 입력)</span>
                          </div>

                          <div id="postBody-${postIndex}" style="${isLocked ? 'display: none;' : 'display: block;'}">
                             <div class="post-content" style="margin-bottom:30px; font-size:1.05rem;">${post.content}</div>
                             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-top:1px dashed #ddd; padding-top:15px;">
                                 <div style="display:flex; gap:10px; align-items:center;">
                                     <button type="button" class="btn" style="background:#f1f5f9; color:#0056D2; border:1px solid #e2e8f0; font-size:0.85rem; padding:6px 12px; display:flex; align-items:center; gap:5px; cursor:pointer;" onclick="likePost(${postIndex})">
                                         <span>👍 추천</span>
                                         <strong>${likesCount}</strong>
                                     </button>
                                     <button type="button" class="reply-btn" onclick="toggleReplyForm(${postIndex})">답글 달기</button>
                                 </div>
                                 ${adminPostControls}
                             </div>
                             ${repliesHtml}
                             <div class="reply-form" id="replyForm-${postIndex}">
                                 <div style="display:flex; gap:10px;">
                                     <input type="text" id="replyName-${postIndex}" placeholder="이름" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;">
                                 </div>
                                 <textarea id="replyContent-${postIndex}" rows="2" placeholder="답글 내용" style="padding:10px; border:1px solid #ddd; border-radius:6px;"></textarea>
                                 <button type="button" class="btn btn-primary" onclick="submitReply(${postIndex})" style="padding:8px 15px; font-size:0.85rem; align-self:flex-start;">답글 등록</button>
                             </div>
                          </div>
                      </div>
                 `;
                 boardList.prepend(postEl);
             });
        };

        window.toggleReplyForm = (index) => {
            const form = document.getElementById(`replyForm-${index}`);
            form.classList.toggle('active');
        };

        window.submitReply = (index) => {
            const nameInput = document.getElementById(`replyName-${index}`);
            const contentInput = document.getElementById(`replyContent-${index}`);
            
            if (!nameInput.value || !contentInput.value) {
                alert('이름과 내용을 모두 입력해주세요.');
                return;
            }

            if (!posts[index].replies) {
                posts[index].replies = [];
            }

            posts[index].replies.push({
                author: nameInput.value,
                content: contentInput.value,
                date: new Date().toLocaleString('ko-KR')
            });

            savePosts();
            renderPosts();
        };

        boardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('boardName').value;
            const email = document.getElementById('boardEmail').value;
            const title = document.getElementById('boardTitle').value;
            const content = document.getElementById('boardMessage').value;
            const isSecret = document.getElementById('boardSecret') ? document.getElementById('boardSecret').checked : false;
            const secretPw = isSecret ? document.getElementById('boardSecretPw').value : '';

            if (isSecret && !secretPw) {
                alert('비밀글로 작성하시려면 비밀번호를 입력해주세요.');
                return;
            }

            if (currentEditIndex >= 0) {
                posts[currentEditIndex].author = name;
                posts[currentEditIndex].email = email;
                posts[currentEditIndex].title = title;
                posts[currentEditIndex].content = content;
                posts[currentEditIndex].isSecret = isSecret;
                posts[currentEditIndex].secretPw = secretPw;
                alert('게시글이 수정되었습니다.');
            } else {
                posts.push({
                    author: name,
                    email: email,
                    title: title,
                    content: content,
                    date: new Date().toLocaleString('ko-KR'),
                    isSecret: isSecret,
                    secretPw: secretPw,
                    replies: [],
                    views: 0,
                    likes: 0
                });
            }

            savePosts();
            renderPosts();
            
            currentEditIndex = -1;
            if (boardSubmitBtn) boardSubmitBtn.innerText = "게시글 등록하기";
            boardForm.reset();
            const pwField = document.getElementById('boardSecretPw');
            if(pwField) pwField.style.display = 'none';
            
            boardForm.style.display = 'none';
            if (showFormBtn) showFormBtn.style.display = 'inline-block';
        });

        renderPosts();
    }

    // --- AI Chatbot Logic ---
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    // --- AI Chatbot Knowledge Base (Refined Version) ---
    const kshKnowledge = {
        profile: {
            name: "김세호 (Kim Se Ho)",
            school: "동양미래대학교 기계공학부 (자동화제어)",
            target: "Lam Research Korea FSE 직무 지망",
            contact: "ksh6181@dongyang.ac.kr"
        },
        experience: {
            metis: {
                name: "(주)메티스",
                key: "반도체 부품 유지보수, 배선 정밀도 100% (오류 0건), 리드타임 20% 단축"
            },
            on: {
                name: "(주)O.N",
                key: "반도체 세정장비 설계, PLC 제어 최적화, MTTR 30분 단축, 장애 재발율 0%"
            }
        },
        skills: {
            main: "PLC (GX Works2), SolidWorks (3D 설계), CNC 가공/생산",
            cert: "자동화설비기능사 (이론과 실무의 완벽한 결합)"
        },
        awards: {
            robot: "2025 보행로봇 경진대회 전체 1위 (다중 링크 설계 전문가)",
            skills: "지방기능경기대회 은상 (PLC/전기 제어 정밀도 입증)"
        }
    };

    const getBotResponse = (input) => {
        const query = input.toLowerCase().replace(/\s+/g, '');
        const matches = (keywords) => keywords.some(k => query.includes(k));

        // 1. Identity & Profile
        if (matches(['누구', '자기소개', '이름', '프로필', '소개', '정보'])) {
            return `반갑습니다! 저는 ${kshKnowledge.profile.name} 엔지니어님의 전문 AI 비서입니다. 엔지니어님은 ${kshKnowledge.profile.school}에서 실무 역량을 닦았으며, 현재 ${kshKnowledge.profile.target}을 목표로 하고 계십니다.`;
        }

        // 2. Career & Experience
        if (matches(['경력', '경험', '회사', '직장', '이력', '근무', '일'])) {
            return `엔지니어님은 실무 경험이 매우 풍부하십니다. \n\n- **${kshKnowledge.experience.metis.name}**: ${kshKnowledge.experience.metis.key}\n- **${kshKnowledge.experience.on.name}**: ${kshKnowledge.experience.on.key}\n\n현장에서의 실질적인 해결 능력이 검증된 준비된 인재입니다.`;
        }

        // 3. Specific Tech & Cert
        if (matches(['기술', '스택', 'plc', '제어', '솔리드', '설계', '기능사', '자격'])) {
            return `핵심 기술 스택은 **${kshKnowledge.skills.main}**입니다. 특히 ${kshKnowledge.skills.cert}를 보유하여, 이론과 실무를 결합한 최고의 장비 유지보수 역량을 발휘합니다.`;
        }

        // 4. Awards & Achievements
        if (matches(['수상', '상', '로봇', '대회', '성적', '전적', '1위'])) {
            return `뛰어난 성과를 증명하는 수상 이력이 있습니다. \n\n- ${kshKnowledge.awards.robot}\n- ${kshKnowledge.awards.skills}\n특히 보행로봇 설계 분야에서 전체 1위를 차지하며 기구학적 설계 감각을 입증하셨습니다.`;
        }

        // 5. Academic & DMU
        if (matches(['학교', '대학', '동양', '과목', '전공'])) {
            return `엔지니어님은 ${kshKnowledge.profile.school}에서 하드웨어와 소프트웨어의 조율을 집중적으로 공부하셨습니다. (Dongyang Mirae University)`;
        }

        // 6. Contact
        if (matches(['연락', '메일', '연락처', '번호', '이메일', '문의'])) {
            return `김세호 엔지니어님께 직접 연락하시려면 **${kshKnowledge.profile.contact}**로 문의해 주세요. 상단의 Contact 섹션에서도 메시지를 보내실 수 있습니다.`;
        }

        // 7. General Greetings
        if (matches(['안녕', '반갑', '안녕하세요', 'hi', 'hello'])) {
            return "안녕하세요! 김세호 엔지니어님의 기술력과 경력 데이터를 완벽하게 학습한 AI 비서입니다. 궁금하신 내용을 질문해 주세요! (예: 경력, 수상, 기술 역량 등)";
        }

        // Fallback
        return "죄송합니다. 제가 충분히 학습하지 못한 내용입니다. 김세호 엔지니어님의 '실무 경력', '주요 수상 이력', 'PLC/설계 역량' 등에 대해 질문해 주시면 상세히 안내해 드릴 수 있습니다.";
    };

    const appendMessage = (sender, text) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        setTimeout(() => {
            const response = getBotResponse(text);
            appendMessage('bot', response);
        }, 1000);
    };

    if (chatToggle && chatWindow) {
        chatToggle.addEventListener('click', () => {
            const isHidden = chatWindow.style.display === 'none';
            chatWindow.style.display = isHidden ? 'flex' : 'none';
        });

        closeChat.addEventListener('click', () => {
            chatWindow.style.display = 'none';
        });

        sendMessage.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // --- Side Dot Navigation Active State Tracking ---
    const sideDots = document.querySelectorAll('.dot-item');
    const sections = document.querySelectorAll('section[id]');

    const navObserverOptions = {
        threshold: 0.4
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                sideDots.forEach(dot => dot.classList.remove('active'));
                const activeDot = document.querySelector(`.dot-item[data-section="${id}"]`);
                if (activeDot) {
                    activeDot.classList.add('active');
                }
            }
        });
    }, navObserverOptions);

    sections.forEach(section => navObserver.observe(section));
});
