'use client';

import { useState, useEffect } from 'react';

interface TelegramChat {
  id: string;
  chatId: string;
  chatType: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
}

export default function TelegramChatsList() {
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChatId, setNewChatId] = useState('');
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/telegram/chats');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при загрузке чатов');
        return;
      }

      setChats(data.chats || []);
    } catch (err) {
      setError('Произошла ошибка при загрузке чатов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChat = async () => {
    if (!newChatId.trim()) {
      setError('Введите Chat ID');
      return;
    }

    try {
      setAdding(true);
      setError('');
      const response = await fetch('/api/telegram/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: newChatId.trim(),
          chatType: 'private',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при добавлении чата');
        return;
      }

      setNewChatId('');
      setShowAddForm(false);
      fetchChats();
    } catch (err) {
      setError('Произошла ошибка при добавлении чата');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/telegram/chats', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchChats();
      }
    } catch (err) {
      console.error('Error toggling chat status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот чат?')) {
      return;
    }

    try {
      const response = await fetch(`/api/telegram/chats?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchChats();
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleSyncChats = async () => {
    try {
      setSyncing(true);
      setError('');
      const response = await fetch('/api/telegram/sync-chats', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при синхронизации чатов');
        return;
      }

      setError('');
      fetchChats();

      // Show success message
      if (data.synced > 0) {
        alert(
          `✅ Успешно синхронизировано ${data.synced} чат(ов) из ${data.total}`
        );
      } else {
        alert(
          `ℹ️ Найдено ${data.total} чат(ов), но все уже были в базе данных. Попробуйте начать новый чат с ботом.`
        );
      }
    } catch (err: any) {
      setError(
        'Произошла ошибка при синхронизации чатов: ' +
          (err.message || 'Неизвестная ошибка')
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 mt-4">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full min-w-0">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Список чатов
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Управление получателями уведомлений Telegram
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSyncChats}
              disabled={syncing}
              className="min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 touch-manipulation text-sm sm:text-base"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Синхронизация...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i>
                  Синхронизировать с ботом
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
            >
              <i className="fas fa-plus"></i>
              Добавить вручную
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Введите Chat ID (например: 123456789)"
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddChat}
                disabled={adding}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Добавление...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Добавить
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewChatId('');
                  setError('');
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Chat ID можно получить через @userinfobot или @getidsbot в
              Telegram
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-2">
            <i className="fas fa-exclamation-circle mt-0.5"></i>
            <div className="text-sm">{error}</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        {chats.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <i className="fab fa-telegram text-5xl sm:text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-base sm:text-lg">
              Чаты не найдены
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              Добавьте Chat ID для получения уведомлений
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-hashtag mr-1 sm:mr-2"></i>Chat ID
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-user mr-1 sm:mr-2"></i>Информация
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-tag mr-1 sm:mr-2"></i>Тип
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-toggle-on mr-1 sm:mr-2"></i>Статус
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-calendar mr-1 sm:mr-2"></i>Добавлен
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-cog mr-1 sm:mr-2"></i>Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chats.map((chat) => (
                <tr
                  key={chat.id}
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    !chat.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-mono font-medium text-gray-900">
                      {chat.chatId}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div>
                      {chat.title ? (
                        <div className="text-sm font-semibold text-gray-900">
                          {chat.title}
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-gray-900">
                          {chat.firstName} {chat.lastName}
                        </div>
                      )}
                      {chat.username && (
                        <div className="text-xs text-gray-500 mt-1">
                          @{chat.username}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <i className="fas fa-tag mr-1"></i>
                      {chat.chatType === 'group' ? 'Группа' : 'Личный'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(chat.id, chat.isActive)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        chat.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <i
                        className={`fas ${
                          chat.isActive ? 'fa-toggle-on' : 'fa-toggle-off'
                        } mr-1`}
                      ></i>
                      {chat.isActive ? 'Активен' : 'Неактивен'}
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-gray-900">
                      {new Date(chat.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDelete(chat.id)}
                      className="inline-flex items-center px-3 py-2 min-h-[36px] text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors gap-2 touch-manipulation"
                    >
                      <i className="fas fa-trash"></i>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-info-circle text-white text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-3">
              Как добавить Chat ID?
            </h3>
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>Наш Telegram бот:</strong>{' '}
                  <code className="bg-indigo-100 px-2 py-1 rounded font-mono">
                    @nam_po_puti_request_bot
                  </code>
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <i className="fas fa-plus text-indigo-500"></i>
                  Ручное добавление
                </p>
                <ol className="text-sm text-gray-600 space-y-1 ml-6 list-decimal">
                  <li>
                    <strong>Для личного чата:</strong> Найдите{' '}
                    <code className="bg-blue-100 px-1 rounded">
                      @userinfobot
                    </code>{' '}
                    в Telegram - он покажет ваш Chat ID
                  </li>
                  <li>
                    <strong>Для группы:</strong> Добавьте{' '}
                    <code className="bg-blue-100 px-1 rounded">@getidsbot</code>{' '}
                    в группу - он покажет Chat ID группы
                  </li>
                  <li>
                    Скопируйте Chat ID (например:{' '}
                    <code className="bg-blue-100 px-1 rounded">123456789</code>)
                  </li>
                  <li>
                    Нажмите <strong>"Добавить вручную"</strong> выше
                  </li>
                  <li>Вставьте Chat ID и нажмите "Добавить"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
