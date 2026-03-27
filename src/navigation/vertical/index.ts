export default [
  {
    title: 'Home',
    to: { name: 'root' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
  },
  {
    title: 'Credit Application',
    icon: { icon: 'tabler-file-analytics' },
    children: [
      {
        title: 'New Line Application',
        to: { name: 'credit-application-line-application' },
      },
      {
        title: 'New Factoring Request',
        to: { name: 'factoring-request' },
      },
      {
        title: 'Request List',
        to: { name: 'credit-application-list' },
      },
    ],
  },
  {
    title: 'User Management',
    icon: { icon: 'tabler-users-check' },
    children: [
      {
        title: 'Registration List',
        to: { name: 'registration-management-list' },
      },
    ],
  },
  {
    title: 'Logout',
    to: { name: 'logout' },
    icon: { icon: 'tabler-logout' },
  },
]
