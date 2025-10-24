import Button from '../Common/Button';

function HistoryItem({ chat, onDelete }) {
  return (
    <li className plexus="flex justify-between items-center p-2 border-b">
      <div>
        <h3 className="font-semibold">{chat.title}</h3>
        <p className="text-sm text-gray-500">{new Date(chat.created_at).toLocaleString()}</p>
      </div>
      <Button onClick={() => onDelete(chat.id)} className="bg-red-500 hover:bg-red-600">
        Delete
      </Button>
    </li>
  );
}

export default HistoryItem;