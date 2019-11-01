import s from 'underscore.string';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Users } from '../../../../models/server/raw';

async function findUsers({ role, text, pagination: { offset, count, sort } }) {
	const query = {};
	if (text) {
		const filterReg = new RegExp(s.escapeRegExp(text), 'i');
		Object.assign(query, { $or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }] });
	}

	const cursor = await Users.findUsersInRolesWithQuery(role, query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		fields: {
			username: 1,
			name: 1,
			status: 1,
			statusLivechat: 1,
			emails: 1,
		},
	});

	const total = await cursor.count();

	const users = await cursor.toArray();

	return {
		users,
		count: users.length,
		offset,
		total,
	};
}
export async function findAgents({ userId, text, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-agent',
		userId,
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}

export async function findManagers({ userId, text, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-manager') || !await hasPermissionAsync(userId, 'manage-livechat-agents')) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-manager',
		userId,
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}
