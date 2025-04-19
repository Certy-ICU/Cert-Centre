import { FormattedMessage, useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { CheckCircle, Clock } from 'lucide-react';
import LanguageSwitcher from '@/components/language-switcher-pages';

export default function Dashboard() {
  const intl = useIntl();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-bold mb-6">
          <FormattedMessage id="Courses.title" defaultMessage="Courses" />
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                <FormattedMessage id="Courses.inProgress" defaultMessage="In Progress" />
              </h2>
              <p className="text-gray-600">0 courses</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                <FormattedMessage id="Courses.completed" defaultMessage="Completed" />
              </h2>
              <p className="text-gray-600">0 courses</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
} 